import * as http from "http";
import * as httpProxy from "http-proxy";
import * as httpBlueGreen from "./http-blue-green"

// TODO: Hard code
const httpPort = 8181;
const proxyHttpPort = 8989;

const proxy = httpProxy.createProxyServer();

const bgProxy = new httpBlueGreen.Proxy(
  proxy,
  // TODO: Hard code
  "http://localhost:8080",
  "http://localhost:9081"
);

const server = http.createServer(function(req, res) {
  bgProxy.handle(req, res);
});


server.listen(httpPort, ()=>{
  console.log(`Listening on ${httpPort}...`);
});


bgProxy.apiServer.listen(proxyHttpPort, ()=>{
  console.log(`API listening on ${proxyHttpPort}...`);
});

// Not to down whole server
process.on('uncaughtException', function (err) {
  console.error('on uncaughtException: ', err);
});
