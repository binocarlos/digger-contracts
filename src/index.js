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

  return either the first array object
  or if length > 1 then wrapper.body = list and return wrapper
  
*/
function multiple_branch(list, wrapper){
  if(list.length<=1){
    return list[0];
  }
  else{
    wrapper.body = list;
    return wrapper;
  }
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

  var self = this;
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

  /*
  
    if there is only a single warehouse url then we do the pipe at the top level

    otherwise we merge all the individual warehouse pipe contracts
    
  */

  var topcontract = {};

  function basic_contract(type){
    return {
      method:'post',
      url:'/reception',
      headers:{
        'Content-Type':'application/json',
        'x-contract-type':type,
        'x-contract-id':utils.diggerid()
      }
    }
  }

  // (warehouseurl + '/resolve').replace(/\/\//g, '/'),
  function create_warehouse_pipe_contract(warehouseurl){
    /*
    
      create a pipe contract out of the selectors
      
    */
    // this is the skeleton to POST to the start of the chain per phase
    var skeleton = groups[warehouseurl].map(function(c){
      return c.get(0)._digger;
    }).filter(function(digger){
      return digger.tag!='_supplychain';
    })

    /*
    
      the top level selectors are phases to be merged
      
    */
    var phase_contracts = selectors.reverse().map(function(selector_phase){

      /*
      
        a single selector chain

        the first step is posted the skeleton from the client container

        each step is piped the results of the previous

        the reception looks after detecting branches in the results
        
      */
      var selector_contracts = selector_phase.phases.map(function(selector_stages){

        var last_selector = selector_stages[selector_stages.length-1];
        var modifier = last_selector.modifier || {};
        modifier.laststep = true;
        last_selector.modifier = modifier;
        
        var selector_requests = selector_stages.map(function(selector){
          return {
            method:'post',
            url:(warehouseurl + '/select').replace(/\/\//g, '/'),
            headers:{
              'Content-Type':'application/json',
              'x-json-selector':selector
            }
          }  
        })

        selector_requests[0].body = skeleton;

        return multiple_branch(selector_requests, basic_contract('pipe'));
      })

      return multiple_branch(selector_contracts, basic_contract('merge'));
    })

    return multiple_branch(phase_contracts, basic_contract('pipe'))
  }

  /*
  
    the top level warehouse grouped contracts

    either a single set of selector resolvers or an array of merges across warehouses
    
  */
  var warehouse_pipe_contracts = warehouseurls.map(create_warehouse_pipe_contract);
  var topcontract = multiple_branch(warehouse_pipe_contracts,  {
    method:'post',
    url:'/reception',
    headers:{
      'Content-Type':'application/json',
      'x-contract-type':'merge',
      'x-contract-id':utils.diggerid()
    }
  })

  return this.supplychain ? this.supplychain.contract(topcontract, self).expect('containers') : topcontract;
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

  /*
  
    this is a direct request not a contract
    
  */
  var raw = {
    method:'post',
    headers:{
      'Content-Type':'application/json',
      'x-contract-type':'merge',
      'x-contract-id':utils.diggerid()
    },
    url:'/reception',
    body:[{
      method:'post',
      headers:{
        'Content-Type':'application/json',
        'x-contract-id':utils.diggerid()
      },
      url:appendto.diggerurl(),
      body:appendmodels
    }]
  }

  appendcontainer.supplychain = this.supplychain;

  return this.supplychain ? this.supplychain.contract(raw, self).after(function(results){
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

  var self = this;
  if(this.count()<=0){
    throw new Error('there is nothing to save');
  }


  var raw = {
    method:'post',
    headers:{
      'Content-Type':'application/json',
      'x-contract-type':'merge',
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
          'Content-Type':'application/json',
          'x-contract-id':utils.diggerid()
        },
        url:container.diggerurl(),
        body:savemodel
      }
    })
  }

  return this.supplychain ? this.supplychain.contract(raw, self) : raw;
}

/*

  DELETE
  
*/
function remove(){

  var self = this;
  if(this.count()<=0){
    throw new Error('there is nothing to delete');
  }

  var raw = {
    method:'post',
    url:'/reception',
    headers:{
      'Content-Type':'application/json',
      'x-contract-type':'merge',
      'x-contract-id':utils.diggerid()
    },
    body:this.map(function(container){
      return {
        method:'delete',
        headers:{
          'Content-Type':'application/json',
          'x-contract-id':utils.diggerid()
        },
        url:container.diggerurl()
      }
    })
  }

  return this.supplychain ? this.supplychain.contract(raw, self) : raw;
}