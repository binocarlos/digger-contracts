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

  it('should merge an existing contract with another merge contract', function(){
    var placeA = Container('testa');
    placeA.path('/123');
    placeA.inode('10');

    var contractA = placeA.remove();

    var placeB = Container('testb');
    placeB.path('/124');
    placeB.inode('11');

    var contractB = placeB.remove();

    var contract = contractA.merge(contractB);

    contract.req.method.should.equal('post');
    contract.req.url.should.equal('/merge');

    contract.req.body.length.should.equal(2);

    var reqA = contract.req.body[0];

    reqA.method.should.equal('delete');
    reqA.url.should.equal('/data/123/10');

    var reqB = contract.req.body[1];

    reqB.method.should.equal('delete');
    reqB.url.should.equal('/data/124/11');


  })


  it('should merge an append contract with another append contract', function(){
    var placeA = Container('testa');
    placeA.path('/123');
    placeA.inode('10');

    var contractA = placeA.append(Container('childA'));

    var placeB = Container('testb');
    placeB.path('/124');
    placeB.inode('11');

    var contractB = placeB.append(Container('childB'));

    var contract = contractA.merge(contractB);

    contract.req.method.should.equal('post');
    contract.req.url.should.equal('/merge');

    contract.req.body.length.should.equal(2);

    var reqA = contract.req.body[0];

    reqA.method.should.equal('post');
    reqA.url.should.equal('/data/123/10');

    var reqB = contract.req.body[1];

    reqB.method.should.equal('post');
    reqB.url.should.equal('/data/124/11');
  })

  it('should merge an select contract with another merge contract', function(){
    var placeA = Container('testa');
    placeA.path('/123');
    placeA.inode('10');

    var contractA = placeA.append(Container('childA'));

    var placeB = Container('testb');
    placeB.path('/124');
    placeB.inode('11');

    var contractB = placeB('thing');

    var contract = contractA.merge(contractB);

    contract.req.method.should.equal('post');
    contract.req.url.should.equal('/merge');

    contract.req.body.length.should.equal(2);

    var reqA = contract.req.body[0];

    reqA.method.should.equal('post');
    reqA.url.should.equal('/data/123/10');

    var reqB = contract.req.body[1];

    reqB.method.should.equal('post');
    reqB.url.should.equal('/select');
  })


  it('should pipe a select contract to an append contract', function(){
    var placeA = Container('testa');
    placeA.path('/123');
    placeA.inode('10');

    var placeB = Container('testb');
    placeB.path('/124');
    placeB.inode('11');

    var contract = placeA('thing').pipe(placeB.append());

    contract.req.method.should.equal('post')
    contract.req.url.should.equal('/pipe');
    contract.req.body.length.should.equal(2);
    contract.req.body[0].method.should.equal('post');
    contract.req.body[0].url.should.equal('/select');
    contract.req.body[0].headers['x-digger-selector'].should.equal('thing');
    contract.req.body[0].body[0].should.equal('/123/10');

    contract.req.body[1].method.should.equal('post');
    contract.req.body[1].url.should.equal('/data/124/11');
  })



  it('should pipe a merge contract to an append contract', function(){
    var placeA = Container('testa');
    placeA.path('/123');
    placeA.inode('10');

    var placeB = Container('testb');
    placeB.path('/124');
    placeB.inode('11');

    var placeC = Container('testc');
    placeC.path('/125');
    placeC.inode('12');

    var contract = placeA('thing').merge(placeB('otherthing')).pipe(placeC.append())

    contract.req.method.should.equal('post')
    contract.req.url.should.equal('/pipe');
    contract.req.body.length.should.equal(2);
    contract.req.body[0].method.should.equal('post');
    contract.req.body[0].url.should.equal('/merge');
    contract.req.body[0].body.length.should.equal(2);
    contract.req.body[0].body[0].method.should.equal('post');
    contract.req.body[0].body[0].url.should.equal('/select');
    contract.req.body[0].body[0].body[0].should.equal('/123/10');
    contract.req.body[0].body[1].method.should.equal('post');
    contract.req.body[0].body[1].url.should.equal('/select');
    contract.req.body[0].body[1].body[0].should.equal('/124/11');

    contract.req.body[1].method.should.equal('post');
    contract.req.body[1].url.should.equal('/data/125/12');
  })



  it('should parse into the simplest form', function(){
    var placeA = Container('testa');
    placeA.path('/123');
    placeA.inode('10');

    
    var savecontract = placeA.save();
    var removecontract = placeA.remove();

    var combocontract = savecontract.merge(removecontract);

    savecontract = savecontract.flatten();
    removecontract = removecontract.flatten();
    combocontract = combocontract.flatten();

    savecontract.req.method.should.equal('put');
    savecontract.req.url.should.equal('/data/123/10');

    removecontract.req.method.should.equal('delete');
    removecontract.req.url.should.equal('/data/123/10');

    combocontract.req.method.should.equal('post');
    combocontract.req.url.should.equal('/merge');
    combocontract.req.body[0].url.should.equal('/data/123/10')
    combocontract.req.body[0].method.should.equal('put')
    combocontract.req.body[1].url.should.equal('/data/123/10')
    combocontract.req.body[1].method.should.equal('delete')

    
  })




  it('should sort out the paths for appended containers', function(){
    var placeA = Container('testa');
    placeA.path('/123');
    placeA.inode('10');

    var subplaceB = Container('testb')

    placeA.append(subplaceB)

    subplaceB.path().should.equal('/123/10')

    
  })


  it('should not have _data in an append contract', function(){
    var placeA = Container('testa');
    placeA.path('/123');
    placeA.inode('10');

    var subplaceB = Container('testb')

    var contract = placeA.append(subplaceB)

    var model = contract.req.body[0]
    
    if(model._data){
        throw new Error('should not have _data')
    }
    

    
  })

  
})
