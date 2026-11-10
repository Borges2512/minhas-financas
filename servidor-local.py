# servidor-local.py — abre o app no computador para testes.
# Como usar: dê dois cliques neste arquivo (ou rode "python servidor-local.py")
# e acesse http://localhost:8123 no navegador. Para parar, feche a janela preta.
# (Este arquivo não é necessário no site publicado.)

import http.server
import os
import webbrowser

PORTA = 8123
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class Manipulador(http.server.SimpleHTTPRequestHandler):
    # Garante os tipos certos (o Windows às vezes informa errado).
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.json': 'application/json',
        '.webmanifest': 'application/manifest+json',
        '.png': 'image/png',
    }

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


http.server.ThreadingHTTPServer.allow_reuse_address = True
with http.server.ThreadingHTTPServer(('', PORTA), Manipulador) as servidor:
    endereco = f'http://localhost:{PORTA}'
    print(f'Minhas Finanças rodando em {endereco}')
    print('Para parar, feche esta janela (ou aperte Ctrl+C).')
    webbrowser.open(endereco)
    servidor.serve_forever()
