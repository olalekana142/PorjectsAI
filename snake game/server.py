from http.server import HTTPServer, SimpleHTTPRequestHandler
import webbrowser
import os

def run_server():
    # Set the port for the server
    port = 8000
    
    # Create server object
    server_address = ('', port)
    httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
    
    # Print server information
    print(f"Server started at http://localhost:{port}")
    
    # Open the game in the default web browser
    webbrowser.open(f'http://localhost:{port}')
    
    # Start the server
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
