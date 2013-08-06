var api = require('../src')
var Container = require('digger-container');

Container.augment_prototype(api);

describe('contract', function(){

  it('should create a merge contract for multiple containers from different warehouses', function(){

    var placeA = Container('_supplychain');
    placeA.diggerwarehouse('/placeA');
    var placeB = Container('_supplychain');
    placeB.diggerwarehouse('/placeB');
    var holder = Container();
    holder.add([placeA, placeB]);

    var contract = holder('caption img', 'product, otherthing');

    contract.body.length.should.equal(2);
    contract.body[0].body[0].body[0].url.should.equal('/placeA/select');
    contract.body[1].body[0].body[0].url.should.equal('/placeB/select');

  })

  it('should create a contract from a simple container select action', function(){
    var placeA = Container('testa');
    placeA.diggerid('123');
    placeA.diggerwarehouse('/placeA');

    var contract = placeA('product');

    contract.method.should.equal('post');
    contract.url.should.equal('/placeA/select');

    contract.body.length.should.equal(1);
  })

  it('should create a contract from a simple container append action', function(){
    var placeA = Container('testa');
    placeA.diggerid('123');
    placeA.diggerwarehouse('/placeA');

    var child = Container('child');

    var contract = placeA.append(child);

    contract.method.should.equal('post');
    contract.url.should.equal('/reception');

    contract.body.length.should.equal(1);

    var req = contract.body[0];

    req.method.should.equal('post');
    req.url.should.equal(placeA.diggerurl());

    req.body.length.should.equal(1);

    placeA.children().eq(0).tag().should.equal('child');
  })

  it('should create a contract from a simple container save action', function(){
    var placeA = Container('testa');
    placeA.diggerid('123');
    placeA.diggerwarehouse('/placeA');

    placeA.attr('test', 10);

    var contract = placeA.save();

    contract.method.should.equal('post');
    contract.url.should.equal('/reception');

    contract.body.length.should.equal(1);

    var req = contract.body[0];

    req.method.should.equal('put');
    req.url.should.equal('/placeA/123');
    req.body.test.should.equal(10);
    req.body._digger.tag.should.equal('testa');
  })

  it('should create a contract from a simple container delete action', function(){
    var placeA = Container('testa');
    placeA.diggerid('123');
    placeA.diggerwarehouse('/placeA');

    var contract = placeA.remove();

    contract.method.should.equal('post');
    contract.url.should.equal('/reception');

    contract.body.length.should.equal(1);

    var req = contract.body[0];

    req.method.should.equal('delete');
    req.url.should.equal('/placeA/123');
  })

})
