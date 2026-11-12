import { Ref, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { PdfTextContent } from '../features/statementImport/types';

// pdf.js (Mozilla's open-source PDF engine) does not run on Hermes, so it runs inside an invisible
// WebView. The PDF bytes are handed to it locally; only the library itself is fetched from the CDN.
const PDFJS_VERSION = '4.10.38';
const PDFJS_BASE = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/legacy/build`;
const LOAD_TIMEOUT_MS = 30_000;

const HTML = `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
  function send(msg) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
  Promise.all([import('${PDFJS_BASE}/pdf.min.mjs'), import('${PDFJS_BASE}/pdf.worker.min.mjs')])
    .then(function (mods) {
      var pdfjsLib = mods[0];
      // Run the worker code on this thread instead of spawning a cross-origin Web Worker.
      globalThis.pdfjsWorker = mods[1];
      pdfjsLib.GlobalWorkerOptions.workerSrc = '${PDFJS_BASE}/pdf.worker.min.mjs';
      window.extractPdfText = async function (id, base64) {
        try {
          var bin = atob(base64);
          var data = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
          var doc = await pdfjsLib.getDocument({ data: data }).promise;
          var meta = await doc.getMetadata().catch(function () { return { info: {} }; });
          var pages = [];
          for (var p = 1; p <= doc.numPages; p++) {
            var page = await doc.getPage(p);
            var content = await page.getTextContent();
            pages.push(content.items
              .filter(function (it) { return it.str && it.str.trim(); })
              .map(function (it) { return { str: it.str, x: it.transform[4], y: it.transform[5] }; }));
          }
          send({ type: 'result', id: id, content: { creationDate: (meta.info && meta.info.CreationDate) || null, pages: pages } });
        } catch (e) {
          send({ type: 'error', id: id, message: String(e && e.message || e) });
        }
      };
      send({ type: 'ready' });
    })
    .catch(function (e) { send({ type: 'loadError', message: String(e && e.message || e) }); });
</script></body></html>`;

export interface PdfTextExtractorHandle {
  extract: (base64: string) => Promise<PdfTextContent>;
}

type Pending = { resolve: (c: PdfTextContent) => void; reject: (e: Error) => void };

export default function PdfTextExtractor({ ref }: { ref: Ref<PdfTextExtractorHandle> }) {
  // react-native-webview declares `WebView<P = undefined>` with props `WebViewProps & P`; TypeScript 6
  // reduces `X & undefined` to never, so pass an explicit empty props type.
  const webview = useRef<WebView<object>>(null);
  const ready = useRef(false);
  const loadError = useRef<string | null>(null);
  const queue = useRef<Array<() => void>>([]);
  const pending = useRef(new Map<number, Pending>());
  const nextId = useRef(1);

  useImperativeHandle(ref, () => ({
    extract: (base64: string) =>
      new Promise<PdfTextContent>((resolve, reject) => {
        if (loadError.current) {
          reject(new Error(loadError.current));
          return;
        }
        const id = nextId.current++;
        const timer = setTimeout(() => {
          if (pending.current.delete(id)) {
            reject(new Error('El lector de PDF tardó demasiado. Revisá tu conexión a internet.'));
          }
        }, LOAD_TIMEOUT_MS);
        pending.current.set(id, {
          resolve: c => { clearTimeout(timer); resolve(c); },
          reject: e => { clearTimeout(timer); reject(e); },
        });
        const run = () => {
          webview.current?.injectJavaScript(`window.extractPdfText(${id}, ${JSON.stringify(base64)}); true;`);
        };
        if (ready.current) run();
        else queue.current.push(run);
      }),
  }), []);

  function handleMessage(event: WebViewMessageEvent) {
    let msg: { type: string; id?: number; content?: PdfTextContent; message?: string };
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'ready') {
      ready.current = true;
      queue.current.splice(0).forEach(run => run());
    } else if (msg.type === 'loadError') {
      loadError.current = 'No se pudo cargar el lector de PDF. Revisá tu conexión a internet.';
      pending.current.forEach(p => p.reject(new Error(loadError.current!)));
      pending.current.clear();
      queue.current = [];
    } else if (msg.id !== undefined) {
      const p = pending.current.get(msg.id);
      if (!p) return;
      pending.current.delete(msg.id);
      if (msg.type === 'result' && msg.content) p.resolve(msg.content);
      else p.reject(new Error(msg.message ?? 'No se pudo leer el PDF'));
    }
  }

  return (
    <View style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} pointerEvents="none">
      <WebView<object>
        ref={webview}
        originWhitelist={['*']}
        source={{ html: HTML, baseUrl: 'https://cdn.jsdelivr.net/' }}
        onMessage={handleMessage}
        javaScriptEnabled
      />
    </View>
  );
}
