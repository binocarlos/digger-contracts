var utils = require('digger-utils');
var EventEmitter = require('events').EventEmitter;

module.exports = {
  select:select,
  append:append,
  save:save,
  remove:remove
}

function Contract(req, supplychain){
  EventEmitter.call(this);
  this.req = req;
  this.supplychain = supplychain;
}

/*
Contract.prototype.stream = function(){
  return this.supplychain.stream(this.req);
}*/

Contract.prototype.ship = function(fn){
  var self = this;
  if(!this.req){
    this.emit('error', 'No request given');
    fn && fn('No request given');
    return;
  }
  if(!this.supplychain){
    this.emit('error', 'No supplychain registered');
    fn && fn('No supplychain registered');
    return;
  }
  this.supplychain.emit('request', this.req, function(error, results){
    if(error){
      self.emit('error', error);
    }
    else{
      self.emit('success', results);
    }
    self.emit('complete', error, results);
    fn && fn(error, results);
  })
}

function select(selector_string, context_string){
  var self = this;

  if(this.count()<=0){
    return new Contract();
  }

  var req = {
    method:'post',
    url:'/select',
    headers:{
      'x-digger-selector':selector_string,
      
      'Content-Type':'application/json'
    },
    body:this.map(function(container){
      return container.diggerurl()
    })
  }

  if(context_string){
    req.headers['x-digger-context'] = context_string;
  }

  return new Contract(req, this.supplychain)
  
}

function append(appendcontainer){
  
  var self = this;

  var req = null;

  if(this.count()<=0){
    return new Contract();
  }

  appendcontainer.recurse(function(container){
    container.removeAttr('_digger.path');
    container.removeAttr('_digger.inode');
  })
  
  var appendmodels = appendcontainer.models;
  
  var appendto = this.eq(0);
  var appendtomodel = this.get(0);

  appendtomodel._children = (appendtomodel._children || []).concat(appendmodels);

  this.ensure_meta();
  appendcontainer.supplychain = this.supplychain;

/*
  var contract = this.supplychain.contract(raw, self);

    contract.on('results', function(results){
      var map = {};
      appendmodels.forEach(function(model){
        map[model._digger.diggerid] = model;
      })
      results.forEach(function(result){
        var model = map[result._digger.diggerid];
        if(model){
          for(var prop in result){
            model[prop] = result[prop];
          }
        }
      })
      return self.spawn(results);
    })

    return contract;
  }*/

  var req = {
    method:'post',
    url:'/data' + appendto.diggerurl(),
    headers:{
      'Content-Type':'application/json'
    },
    body:appendcontainer.models
  }


  return new Contract(req, this.supplychain)
}


function save(){
  var self = this;

  if(this.count()<=0){
    return new Contract();
  }

  var req = {
    method:'post',
    url:'/merge',
    headers:{
      'Content-Type':'application/json'
    },
    body:this.map(function(container){
      var model = container.get(0);
      var savemodel = JSON.parse(JSON.stringify(model));
      delete(savemodel._children);
      delete(savemodel._digger.data);
      return {
        method:'put',
        url:'/data' + container.diggerurl(),
        body:savemodel
      }
    })
  }

  return new Contract(req, this.supplychain);
}

function remove(){
  var self = this;

  if(this.count()<=0){
    return new Contract();
  }

  var req = {
    method:'post',
    url:'/merge',
    headers:{
      'Content-Type':'application/json'
    },
    body:this.map(function(container){
      return {
        method:'delete',
        url:'/data' + container.diggerurl()
      }
    })
  }

  return new Contract(req, this.supplychain);
}