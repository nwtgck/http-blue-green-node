import * as httpProxy from "http-proxy";
import * as http from "http";
import * as express from "express";
import * as bodyParser from "body-parser";

export class Proxy {
  bgToSymbols = {
    "blue": new Set(),
    "green": new Set()
  };

  bgState: "blue" | "green" = "blue";

  apiServer: express.Express = appGenerator(this);

  constructor(readonly proxy: httpProxy, readonly blueTarget: string, readonly greenTarget: string){}

  handle(req: http.IncomingMessage, res: http.ServerResponse){
    const currentBgState = this.bgState;
    const symbol = Symbol();
    this.bgToSymbols[currentBgState].add(symbol);
    switch (currentBgState) {
      case "blue":
        this.proxy.web(req, res, { target: this.blueTarget });
        break;
      case "green":
        this.proxy.web(req, res, { target: this.greenTarget });
        break;
      default:
        console.error("Unexpected error: not blue or green");
    }

    const deleteSymbol = ()=>{
      this.bgToSymbols[currentBgState].delete(symbol);
      console.log("bgToSymbols: ", this.bgToSymbols);
    };
    req.on("close", ()=>{
      console.log(`req on close`);
      deleteSymbol();
    });
    req.on("end", ()=>{
      console.log(`req on end`);
      deleteSymbol();
    });
    req.on("error", ()=>{
      console.log(`req on error`);
      deleteSymbol();
    });

    res.on("close", ()=>{
      console.log(`res on close`);
      deleteSymbol();
    });
    res.on("finish", ()=>{
      console.log(`res on finish`);
      deleteSymbol();
    });
    res.on("error", ()=>{
      console.log(`res on error`);
      deleteSymbol();
    });
  }

  setBgState(bgState: "blue" | "green") {
    this.bgState = bgState;
  }

  toggleBgState() {
    this.bgState = this.bgState === "blue" ? "green" : "blue";
  }
}


function appGenerator(proxy: Proxy): express.Express {
  const app = express();
  // (from: https://qiita.com/mas0061/items/f6cb22db1a7ec121fd81)
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.get("/bg-state", (req, res)=>{
    res.json({
      bgState: proxy.bgState,
      nBlues: proxy.bgToSymbols.blue.size,
      nGreens: proxy.bgToSymbols.green.size
    });
  });
  app.post("/bg-state", (req, res)=>{
    const bgStateStr: string = req.body.bgState;
    console.log(req.body);
    if(typeof bgStateStr === "undefined") {
      res.json({
        error: "Error: bgState is required"
      });
    } else {
      switch (bgStateStr) {
        case "blue":
        case "green":
          proxy.setBgState(bgStateStr);
          res.json({
            bgState: proxy.bgState
          });
          break;
        default:
          res.json({
            error: `Error: bgState should be "blue" or "green" not found "${bgStateStr}"`
          });
      }
    }
  });
  app.post("/toggle-bg-state", (req, res)=>{
    // Toggle the state
    proxy.toggleBgState();
    res.json({
      bgState: proxy.bgState
    });
  });
  return app;
}
