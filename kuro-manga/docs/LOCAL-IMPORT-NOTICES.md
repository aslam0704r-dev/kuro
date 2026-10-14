# Local import components

KURO uses the following pinned browser components for device import. Files are processed locally; no decoder needs an account key.

- PDF.js / pdfjs-dist **6.4.299**, Mozilla Foundation, Apache 2.0. The upstream display and parsing worker are bundled under `dist/vendor/local`; the interactive viewer and QuickJS scripting assets are excluded. [Upstream project](https://mozilla.github.io/pdf.js/).
- libarchive-wasm **1.2.0**, ofk, MIT. [Upstream project](https://github.com/ofk/libarchive-wasm).
- The upstream libarchive-wasm build uses libarchive **3.7.7**, zlib **1.3.1**, bzip2 **1.0.8**, liblzma / XZ **5.6.4** and OpenSSL **3.4.1**, as described in the upstream pinned build recipe. KURO modifies the distributed WASM memory type to cap memory at **512 MiB**, and isolates extraction in a dedicated, cancellable worker. This is a resource boundary; it is not a claim that third-party native decoders are free of vulnerabilities.

License texts are bundled in `client/local/licenses`, `client/local/LICENSE-libarchive-wasm`, and `dist/vendor/local/`. PDF.js image-decoder notices accompany the copied `wasm` directory. The license choices for the blake2 implementation in libarchive include Apache 2.0; the OpenSSL license text is included. The UCS/UC Regents compress-filter notice is included separately below in the delivered notices.

The upstream module and wrapper are not authored by KURO. Upgrade the pinned decoder and rerun the container/security tests when upstream releases a replacement; do not silently remove the WASM memory bound or enable PDF scripting.
