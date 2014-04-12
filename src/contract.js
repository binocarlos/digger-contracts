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

Contract.prototype.ship = function(fn){
  if(!this.req){
    this.emit('error', 'no models in container');
    return;
  }
  if(!this.supplychain){
    this.emit('error', 'no supplychain assigned');
    return;
  }
  return this.supplychain.ship(this, fn);
}

Contract.prototype.merge = function(contract){
  if(this.req.url==='/merge'){
    if(contract.req.url==='/merge'){
      this.req.body = (this.req.body || []).concat(contract.req.body);
    }
    else{
      this.req.body.push(contract.req)
    }
  }
  else{
    this.req = {
      method:'post',
      url:'/merge',
      body:[this.req, contract.req]
    }
  }

  return this;
}

Contract.prototype.pipe = function(contract){
  if(this.req.url==='/pipe'){
    if(contract.req.url==='/pipe'){
      this.req.body = (this.req.body || []).concat(contract.req.body);
    }
    else{
      this.req.body.push(contract.req)
    }
  }
  else{
    this.req = {
      method:'post',
      url:'/pipe',
      body:[this.req, contract.req]
    }
  }

  return this;
}

Contract.prototype.parse = function(){
  if((this.req.url==='/merge' || this.req.url==='/pipe') && this.req.body.length<=1){
    this.req = this.req.body[0];
  }
  return this;
}