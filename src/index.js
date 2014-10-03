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
    url:utils.urls.select,
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

    function recurse(container, parent){
      container.removeAttr('_data');
      if(!container.inode()){
        container.inode(utils.littleid())  
      }
      container.path(parent.diggerurl())
      container.children().each(function(c){
        recurse(c, container)
      })
    }

    recurse(appendcontainer, appendto)

    appendmodels = appendcontainer.models;
    appendcontainer.supplychain = this.supplychain;

    appendtomodel._children = (appendtomodel._children || []).concat(appendmodels);

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

  appendmodels = JSON.parse(JSON.stringify(appendmodels))

  function stripdata(model){
    
    delete(model._data)
    model._children = (model._children || []).map(function(c){
      return stripdata(c)
    })

    return model
  }

  appendmodels = appendmodels.map(stripdata)

  var req = {
    method:'post',
    url:appendto.diggerurl(),
    headers:{
      'Content-Type':'application/json'
    },
    body:appendmodels || []
  }


  var contract = new Contract(req, this.supplychain)

  // merge in the data once its appended
  contract.on('success', function(results){
    results.each(function(r){
      var hit = appendcontainer.find('=' + r.diggerid())
      if(hit){
        hit.inject_data(r.get(0))
      }
    })
  })

  return contract
}


function save(){
  var self = this;

  if(this.count()<=0){
    return new Contract();
  }

  var req = {
    method:'post',
    url:utils.urls.merge,
    headers:{
      'Content-Type':'application/json'
    },
    body:this.map(function(container){
      var model = container.get(0);
      var savemodel = JSON.parse(JSON.stringify(model));
      delete(savemodel._children);
      delete(savemodel._data);
      return {
        method:'put',
        url:container.diggerurl(),
        body:[savemodel]
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
    url:utils.urls.merge,
    headers:{
      'Content-Type':'application/json'
    },
    body:this.map(function(container){
      var model = container.get(0);
      var removemodel = JSON.parse(JSON.stringify(model));
      delete(removemodel._children);
      delete(removemodel._data);
      return {
        method:'delete',
        url:container.diggerurl()
      }
    })
  }

  return new Contract(req, this.supplychain);
}