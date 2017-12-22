import { test } from 'qunit';
import moduleForAcceptance from '../../tests/helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | app');

test('app.scss is loaded', function(assert) {
  visit('/');

  andThen(() => {
    assert.equal(find('#test0').css('color'), 'rgb(255, 0, 0)', 'red');
    assert.equal(find('#test1').css('color'), 'rgb(0, 128, 0)', 'green');
    assert.equal(find('#test2').css('color'), 'rgb(0, 0, 255)', 'blue');
  });
});
