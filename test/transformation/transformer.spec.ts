import {TransformerService} from '../../src/transformation/transformer';
import {model, expose} from '../../src/transformation/decorators';
import {Document} from '../../src/models/document';
import {expect} from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';

chai.use(chaiAsPromised);

describe('TransformerService', () => {
  @model('test.TestModel')
  class TestModel extends Document {
    @expose()
    public foo: string;
  }

  const ts = new TransformerService([TestModel, Document]);

  describe('toInstance', () => {
    it('should transform a plain object', () => {
      const plain = {foo: 'bar', _model: 'test.TestModel'};
      return ts.toInstance(plain, 'persist').then((obj: TestModel) => {
        expect(obj._model).to.eql('test.TestModel');
        expect(obj.foo).to.eql('bar');
      });
    });

    it('should fail to transform a plain object with an unknown model', () => {
      const plain = {foo: 'bar', _model: 'noSuchModel'};
      expect(ts.toInstance(plain, 'persist')).to.be.rejectedWith(Error);
    });

    it('should transform a plain object with default model', () => {
      const plain = {foo: 'bar'};
      return ts.toInstance(plain, 'persist', 'test.TestModel').then((obj: TestModel) => {
        expect(obj._model).to.eql('test.TestModel');
        expect(obj.foo).to.eql('bar');
      });
    });

    it('should fail to transform a plain object with an unknown default model', () => {
      const plain = {foo: 'bar'};
      expect(ts.toInstance(plain, 'persist', 'noSuchModel')).to.be.rejectedWith(Error);
    });

    it('should transform a plain object to isimud.Document when no model specified', () => {
      const plain = {foo: 'bar'};
      return ts.toInstance(plain, 'persist').then((obj: Document) => {
        expect(obj._model).to.eql('isimud.Document');
        expect(obj).to.not.haveOwnProperty('foo');
      });
    });
  });

  describe('toPlain', () => {
    const instance = new TestModel();
    instance.foo = 'bar';

    ts.toPlain(instance, 'persist').then((obj: any) => {
      expect(obj.foo).to.eql('bar');
      expect(obj._model).to.eql('test.TestModel');
    });
  });
});
