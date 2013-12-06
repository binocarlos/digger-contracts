digger-contracts
================

![Build status](https://api.travis-ci.org/binocarlos/digger-contracts.png)

The contract factory for digger server requests

## installation
	
	$ npm install digger-contracts

## select example
Generate a HTTP request representing a select query upon a digger container

```js
var Container = require('digger-container');
var Contracts = require('digger-contracts');

Container.augment_prototype(Contracts);

var container = Container('product');
container.diggerwarehouse('/api/db3');
container.diggerid(123);


var contract = container('product');

/*

	{
		method:'post',
		url:'/reception',
		body:[{
			method:'post',
			url:'/api/db3/123/resolve',
			body:{
				selectors:[[[{
					tag:'product'
				}]]],
				skeleton:{
					diggerid:123
				}
			}
		}]
	}
	
*/
```

## append example
Generate a HTTP request representing an append query upon a digger container

```js
var Container = require('digger-container');
var Contracts = require('digger-contracts');

Container.augment_prototype(Contracts);

var container = Container('product');
container.diggerwarehouse('/api/db3');
container.diggerid(123);

var child = Container('review', {
	title:'text'
});

var contract = container.append(child);

/*

	{
		method:'post',
		url:'/api/db3/123',
		body:[{
			title:'text',
			_digger:{
				tag:'review',
				diggerid:456 // auto-generated
			}
		}]
	}
	
*/
```


## save example
Generate a HTTP request representing a save query upon a digger container

```js
var Container = require('digger-container');
var Contracts = require('digger-contracts');

Container.augment_prototype(Contracts);

var container = Container('product');
container.diggerwarehouse('/api/db3');
container.diggerid(123);

container.attr('fruit', 'apples').addClass('green');

var contract = container.save();

/*

	{
		method:'post',
		url:'/reception',
		body:[{
			method:'put',
			url:'/api/db3/123',
			body:{
				fruit:'apples',
				_digger:{
					diggerwarehouse:'/api/db3',
					diggerid:123,
					tag:'product',
					class:['green']
				}
			}
		}]
	}
	
*/
```

## remove example
Generate a HTTP request representing a save query upon a digger container

```js
var Container = require('digger-container');
var Contracts = require('digger-contracts');

Container.augment_prototype(Contracts);

var container = Container('product');
container.diggerwarehouse('/api/db3');
container.diggerid(123);

var contract = container.remove();

/*

	{
		method:'post',
		url:'/reception',
		body:[{
			method:'delete',
			url:'/api/db3/123'
		}]
	}
	
*/
```