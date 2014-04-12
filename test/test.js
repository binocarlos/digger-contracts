var api = require('../src')
var Container = require('digger-container');

function augment_prototype(api){
  for(var prop in api){
    Container.prototype[prop] = api[prop];
  }
}

augment_prototype(api);

describe('contract', function(){

  it('should create a merge contract for multiple containers from different warehouses', function(){

    var placeA = Container('_supplychain');
    placeA.path('/placeA');
    placeA.inode('10');
    var placeB = Container('_supplychain');
    placeB.path('/placeA');
    placeB.inode('11');
    var holder = Container();
    holder.add([placeA, placeB]);

    var contract = holder('caption img', 'product, otherthing');

    contract.req.method.should.equal('post');
    contract.req.url.should.equal('/select');
    contract.req.headers['x-digger-selector'].should.equal('caption img');
    contract.req.headers['x-digger-context'].should.equal('product, otherthing');
    
    contract.req.body.length.should.equal(2);
    contract.req.body[0].should.equal('/placeA/10');
    contract.req.body[1].should.equal('/placeA/11');

  })


  it('should assign the content type as json', function(){
    var placeA = Container('testa');
    placeA.path('/123');
    placeA.inode('10');

    var contract = placeA('product');

    contract.req.headers['Content-Type'].should.equal('application/json');
  })

  it('should create a select contract', function(){
    var placeA = Container('testa');
    placeA.path('/123');
    placeA.inode('10');

    var contract = placeA('product', 'folder#hello');

    contract.req.method.should.equal('post');
    contract.req.url.should.equal('/select');
    contract.req.headers['x-digger-selector'].should.equal('product');
    contract.req.headers['x-digger-context'].should.equal('folder#hello');

    contract.req.body.length.should.equal(1);
    contract.req.body[0].should.equal('/123/10')
  })


  it('the context header should not be set with no context given', function(){
    var placeA = Container('testa');
    placeA.path('/123');
    placeA.inode('10');

    var contract = placeA('product');

    (contract.req.headers['x-digger-context']===undefined).should.equal(true);
  })

  it('should create a append contract', function(){
    var placeA = Container('testa');
    placeA.path('/123');
    placeA.inode('10');

    var child = Container('child');

    var contract = placeA.append(child);

    var req = contract.req;

    req.method.should.equal('post');
    req.url.should.equal('/data/123/10');

    req.body.length.should.equal(1);

    placeA.children().eq(0).tag().should.equal('child');
  })

  it('should create a save contract', function(){
    var placeA = Container('testa');
    placeA.path('/123');
    placeA.inode('10');

    placeA.attr('test', 10);

    var contract = placeA.save();

    contract.req.method.should.equal('post');
    contract.req.url.should.equal('/merge');

    contract.req.body.length.should.equal(1);

    var req = contract.req.body[0];

    req.method.should.equal('put');
    req.url.should.equal('/data/123/10');
    req.body.test.should.equal(10);
    req.body._digger.tag.should.equal('testa');
  })

  it('should create a remove contract', function(){
    var placeA = Container('testa');
    placeA.path('/123');
    placeA.inode('10');

    var contract = placeA.remove();

    contract.req.method.should.equal('post');
    contract.req.url.should.equal('/merge');

    contract.req.body.length.should.equal(1);

    var req = contract.req.body[0];

    req.method.should.equal('delete');
    req.url.should.equal('/data/123/10');
  })



})
