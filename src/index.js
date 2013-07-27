/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/*
  Module dependencies.
*/

var Selector = require('digger-selector');
var utils = require('digger-utils');

module.exports = {
  select:select,
  append:append,
  save:save,
  remove:remove
}

/*

  SELECT 
  turns an array of selector strings into a pipe contract

  the strings are reversed as in:

    "selector", "context"

  becomes

    context selector

  in the actual search (this is just how jQuery works)
  
*/
function select(selector_string, context_string){

  if(this.count()<=0){
    throw new Error('attempting a select on an empty container');
  }

  /*
  
    first get an array of selector objects

    we make a pipe contract out of these

    then duplicate that pipe contract for each different diggerwarehouse

    
  */
  var strings = [selector_string];
  if(arguments.length>1){
    strings.push(context_string);
  }
  
  var selectors = strings.map(function(selector){
    return Selector(selector);
  })
  
  /*
  
    the 'context' are the models inside 'this' container

    the _digger objects will be sent as the body of the select request
    for each supplier to use as the context (i.e. starting point for the query)

    
  */

  var context = this.containers();

  /*
  
    split out the current context into their warehouse origins
    
  */
  var groups = {};

  this.each(function(container){
    var warehouse = container.diggerwarehouse() || '/';
    var arr = groups[warehouse] || [];
    arr.push(container);
    groups[warehouse] = arr;
  })
  
  var warehouseurls = Object.keys(groups);

  /*
  
    the top level contract - this will be resolved in the holdingbay

    it is a merge of the various warehouse targets
    
  */
  var raw = {
    method:'post',
    url:'/reception',
    headers:{
      'x-contract-id':utils.diggerid()
    },
    body:warehouseurls.map(function(warehouseurl){
      var skeleton = groups[warehouseurl].map(function(c){
        return c.get(0)._digger;
      }).filter(function(digger){
        return digger.tag!='_supplychain';
      })
      return {
        method:'post',
        headers:{
          'x-contract-id':utils.diggerid()
        },
        url:(warehouseurl + '/resolve').replace(/\/\//g, '/'),
        body:{
          selectors:selectors,
          skeleton:skeleton
        }

      }
    })
  }

  return this.supplychain ? this.supplychain.contract(raw, function(results){
    return self.spawn(results);
  }) : raw;
}

/*

  POST

  
*/
function append(appendcontainer){

  var self = this;
  
  if(arguments.length<=0 || appendcontainer.count()<=0){
    throw new Error('there is nothing to append');
  }

  if(this.count()<=0){
    throw new Error('there is nothing to append to');
  }

  var appendmodels = appendcontainer.models;
  
  var appendto = this.eq(0);
  var appendtomodel = this.get(0);

  appendtomodel._children = (appendtomodel._children || []).concat(appendmodels);

  var raw = {
    method:'post',
    headers:{
      'x-contract-id':utils.diggerid()
    },
    url:appendto.diggerurl(),
    body:appendmodels
  }

  return this.supplychain ? this.supplychain.contract(raw, function(results){
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
  }) : raw;
}

/*

  PUT
  
*/
function save(){

  if(this.count()<=0){
    throw new Error('there is nothing to save');
  }

  var raw = {
    method:'post',
    headers:{
      'x-contract-id':utils.diggerid()
    },
    url:'/reception',
    body:this.map(function(container){
      var model = container.get(0);
      var savemodel = JSON.parse(JSON.stringify(model));
      delete(savemodel._children);
      delete(savemodel._digger.data);
      return {
        method:'put',
        headers:{
          'x-contract-id':utils.diggerid()
        },
        url:container.diggerurl(),
        body:savemodel
      }
    })
  }

  return this.supplychain ? this.supplychain.contract(raw) : raw;
}

/*

  DELETE
  
*/
function remove(){

  if(this.count()<=0){
    throw new Error('there is nothing to delete');
  }

  var raw = {
    method:'post',
    url:'/reception',
    headers:{
      'x-contract-id':utils.diggerid()
    },
    body:this.map(function(container){
      return {
        method:'delete',
        headers:{
          'x-contract-id':utils.diggerid()
        },
        url:container.diggerurl()        
      }
    })
  }

  return this.supplychain ? this.supplychain.contract(raw) : raw;
}