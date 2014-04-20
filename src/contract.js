var utils = require('digger-utils');
var EventEmitter = require('events').EventEmitter;

function Contract(req, supplychain){
  EventEmitter.call(this);
  this.req = req;
  this.supplychain = supplychain;
}

module.exports = Contract;
utils.inherits(Contract, EventEmitter);

Contract.prototype.stream = function(){
  if(!this.req){
    this.emit('error', 'no models in container');
    return;
  }
  if(!this.supplychain){
    this.emit('error', 'no supplychain assigned');
    return;
  }
  return this.supplychain.stream(this);
}

Contract.prototype.duplex = function(){
  if(!this.req){
    this.emit('error', 'no models in container');
    return;
  }
  if(!this.supplychain){
    this.emit('error', 'no supplychain assigned');
    return;
  }
  return this.supplychain.duplex(this);
}

Contract.prototype.ship = function(fn, errorfn){
  if(!this.req){
    this.emit('error', 'no models in container');
    return;
  }
  if(!this.supplychain){
    this.emit('error', 'no supplychain assigned');
    return;
  }
  return this.supplychain.ship(this, fn, errorfn);
}

Contract.prototype.then = Contract.prototype.ship;


function flatten(req){
  var newreq = JSON.parse(JSON.stringify(req))
  var url = req.url;

  var newarr = [];

  (newreq.body || []).forEach(function(c){
    if(c.url===url){
      newarr = newarr.concat(c.body)
    }
    else{
      newarr.push(c);
    }
  })

  newreq.body = newarr;

  if(newreq.body.length===1){
    newreq = newreq.body[0];
  }

  return newreq;
}

function addcontract(url, contract, newcontract){
  var newreq = JSON.parse(JSON.stringify(contract.req))

  if(contract.req.url===url){
    if(newcontract.req.url===url){
      newreq.body = (newreq.body || []).concat(newcontract.req.body);
    }
    else{
      newreq.body.push(newcontract.req)
    }
  }
  else{
    newreq = {
      method:'post',
      url:url,
      body:[newreq, newcontract.req]
    }
  }

  return flatten(newreq);
}


Contract.prototype.merge = function(contract){
  return new Contract(addcontract('/merge', this, contract), this.supplychain);
}

Contract.prototype.pipe = function(contract){
  return new Contract(addcontract('/pipe', this, contract), this.supplychain);
}

Contract.prototype.flatten = function(){
  return new Contract(flatten(this.req), this.supplychain);
}