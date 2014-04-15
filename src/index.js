var utils = require('digger-utils');
var Contract = require('./contract');

module.exports = {
  select:select,
  append:append,
  save:save,
  remove:remove
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

  var appendmodels = [];
  var appendto = this.eq(0);
  var appendtomodel = this.get(0);

  if(appendcontainer){

    appendcontainer.recurse(function(container){
      container.removeAttr('_digger.path');
      container.removeAttr('_digger.inode');
      container.removeAttr('_data');
    })  

    appendmodels = appendcontainer.models;
    appendcontainer.supplychain = this.supplychain;

    appendtomodel._children = (appendtomodel._children || []).concat(appendmodels);

    appendmodels = JSON.parse(JSON.stringify(appendmodels));

    this.ensure_meta();
  }

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
    body:appendmodels || []
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