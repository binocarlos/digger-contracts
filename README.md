digger-contracts
================

![Build status](https://api.travis-ci.org/binocarlos/digger-contracts.png)

The contract factory for digger server requests

## installation

```	
$ npm install digger-contracts
```

## usage

There are four types of contract that digger can resolve:

 * select - load data from below a container using a selector filter
 * append - add containers to another container
 * save - update the data for a container
 * remove - remove a container

## select example
Generate a select contract from a container by running the container as a function or running the 'select' method.

You give the selector and context as arguments - the context is piped into the selector.

```js
var container = $digger.connect('/my/location');
var contract = container('folder.red', '#top');

console.log(contract.parse());

/*
{
	method:'post',
	url:'/select',
	headers:{
		'x-digger-selector':'folder.red',
		'x-digger-context':'#top'
	}
	body:[
		'/my/location'
	]
}	
*/
```

## append example
Generate an append contract by appending a container to another container:

```js
var container = $digger.connect('/my/location');

var child = $digger.create('folder', {
	name:'test'
})

var contract = container.append(child);

console.log(contract.parse());


/*

	{
		method:'post',
		url:'/my/location',
		body:[{
			name:'test',
			_digger:{
				tag:'folder',
				diggerid:3249394383838,
				path:'/my/location',
				inode:'df9f83'
			}
		}]
	}
	
*/
```


## save example
Generate a save contract by calling the save method on a container:

```js
var warehouse = $digger.connect('/my/location');

warehouse('folder.red').ship(function(folder){
	var contract = folder.attr('price', 34).save();

	console.log(contract.parse());
})

/*

	{
		method:'put',
		url:'/data/my/location/343fc3/33f33f',
		body:{
			name:'item',
			price:34,
			_digger:{
				path:'/my/location/343fc3/33f33f',
				tag:'folder',
				class:['red']
			}
		}
	}
	
*/
```

## remove example
Generate a remove contract:

```js
var warehouse = $digger.connect('/my/location');

warehouse('folder.red').ship(function(folder){
	var contract = folder.remove();

	console.log(contract.parse());
})

/*

	{
		method:'delete',
		url:'/data/my/location/343fc3/33f33f'
	}
	
*/
```