var expect = require('chai').expect;
var sinon  = require('sinon');
var fsMock = require('mock-fs');
var join   = require('path').join;
var fs     = require('fs');

describe('tashmetu.storage', function() {
  var storage = require('../../lib/services/storage.js')();
  var resource = storage.resource('post', {
    pattern: 'posts/{name}.md'
  });

  before(function() {
    fsMock({
      'tashmetu': {
        'posts': {
          'first.md': 'First post content',
          'second.md': 'Second post content'
        },
        'taxonomies': {
          'categories.yml': '- cars\n- boats'
        }
      }
    });
  });

  after(function() {
    fsMock.restore();
  });

  describe('get', function() {
/*
    it('should return an error if query does not match resource params', function(done) {
      resource.get({}, function(err, obj) {
        expect(err).to.equal('Missing one or more parameters');
        done();
      });
    });

    it('should return error if get-function is not defined');

    it('should read the file from the file system', function(done) {
      resource.get({name: 'first'}, function(err, obj) {
        expect(obj).to.equal('First post content');
        done();
      });
    });
*/
  });

/*
  var validator = {
    checkPost: function() {}
  };
  var storage = require('../../lib/services/storage.js')(validator);
  var basePath = join(process.cwd(), 'tashmetu');

  // Set up validator
  var schema = { id: 'mock schema' };
  var checkPostStub = sinon.stub(validator, 'checkPost');
  var passVerdict = { success: true, schema: schema, errors: [] };
  var failVerdict = { success: false, schema: schema, errors: ['mock error'] };

  before(function() {
    fsMock({
      'tashmetu': {
        'posts': {
          'first.md': '---\ntitle: First post\n---Test content',
          'second.md': '---\ntitle: Second post\n---'
        },
        'taxonomies': {
          'categories.yml': '- cars\n- boats'
        }
      }
    });
  });

  beforeEach(function() {
    validator.checkPost.reset();
  });

  after(function() {
    fsMock.restore();
  });

  describe('post', function() {
    it('should throw an exception if post does not exist', function() {
      var fn = storage.post.bind(storage, 'nonexistent');
      var path = join(basePath, 'posts/nonexistent.md');

      expect(fn).to.throw(storage.ParseException)
        .which.deep.equals({
          name: 'nonexistent',
          file: path,
          message: "ENOENT, no such file or directory '" + path + "'",
        });
    });

    describe('throws a validation exception that', function() {
      var fn = storage.post.bind(storage, 'first');
      var path = join(basePath, 'posts/first.md');

      before(function() {
        checkPostStub.returns(failVerdict);
      });

      it('should contain the post object', function() {
        expect(fn).to.throw(storage.ValidationException)
          .to.have.property('obj');
      });

      it('should contain errors from verdict', function() {
        expect(fn).to.throw(storage.ValidationException)
          .to.have.property('errors').that.eql(['mock error']);
      });

      it('should contain schema that post was validated against', function() {
        expect(fn).to.throw(storage.ValidationException)
          .to.have.property('schema').that.deep.equals(schema);
      });
    });

    describe('returns a valid post object that', function() {
      before(function() {
        var fn = storage.post.bind(storage, 'test');
        var path = join(basePath, 'posts/first.md');
        checkPostStub.returns({ success: true, schema: schema, errors: [] });
      });

      it('should have content', function() {
        expect(storage.post('first').__content).to.equal('Test content');
      });

      it('should have a name', function() {
        expect(storage.post('first').name).to.equal('first');
      });

      it('should have parsed yaml content', function() {
        expect(storage.post('first').title).to.equal('First post');
      });

      it('should have a timestamp for last modification', function() {
        expect(storage.post('first')).to.have.property('modified');
      });
    });
  });

  describe('posts', function() {
    before(function() {
      checkPostStub
        .onFirstCall().returns(passVerdict)
        .onSecondCall().returns(failVerdict);
    });

    describe('without "suppressErrors"', function() {
      it('should throw exception if one or more posts fail validation', function() {
        var fn = storage.posts.bind(storage);
        expect(fn).to.throw(storage.ValidationException);
      });
    });

    describe('with "suppressErrors"', function() {
      it('should return the valid posts', function() {
        var posts = storage.posts(true);
        expect(posts).to.have.lengthOf(1);
      });
    });
  });

  describe('storePost', function() {
    var post = {
      title: 'Test post',
      __content: 'Test content'
    };

    it('should throw exception if post is not valid', function() {
      checkPostStub.onFirstCall().returns(failVerdict);
      var fn = storage.storePost.bind(storage, post);

      expect(fn).to.throw(storage.ValidationException);
    });

    describe('when successful', function() {
      before(function() {
        checkPostStub.onFirstCall().returns(passVerdict);
      });

      it('should return the path of the file written to', function() {
        expect(storage.storePost(post)).to.equal('tashmetu/posts/test-post.md');
      });

      it('should store the post', function() {
        storage.storePost(post);

        expect(fs.readFileSync('tashmetu/posts/test-post.md', 'utf8'))
          .to.equal('---\ntitle: Test post\n---\nTest content');
      });

      it('should remove whitespace from start and end of content', function() {
        post.__content = '\n\n\t  Content within  \n';
        storage.storePost(post);

        expect(fs.readFileSync('tashmetu/posts/test-post.md', 'utf8'))
          .to.equal('---\ntitle: Test post\n---\nContent within');
      });
    });
  });

  describe('taxonomy', function() {
    describe('returns a valid taxonomy object that', function() {
      it('should have a name', function() {
        expect(storage.taxonomy('categories'))
          .to.have.property('name').that.equals('categories');
      });
      it('should have a list of terms', function() {
        expect(storage.taxonomy('categories'))
          .to.have.property('terms').that.eql(['cars', 'boats']);
      });
    });
  });
*/
});

