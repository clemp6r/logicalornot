import RoundClass from './RoundClass';
import ViewClass from './ViewClass';
import PubSubClass from './PubSubClass';

export default class GameClass {
  constructor (proxy, questions, taunts) {
    this.questions = questions;
    this.taunts    = taunts;
    this.stream    = new PubSubClass(this);
    this.view      = new ViewClass(proxy, this.stream);
    this.round     = null;

    this.bind();
    this.newRound();
  }

  animateIntro () {
    this.view.render('body', 'addClass', 'active');
  }

  bind () {
    this
      .stream
      .subscribe('round:newQuestion', (newQuestion) => {
        this.view.render('question',           'html', newQuestion.question);
        this.view.render('answer-left-label',  'html', newQuestion.answers.left.answer);
        this.view.render('answer-up-label',    'html', newQuestion.answers.up.answer);
        this.view.render('answer-right-label', 'html', newQuestion.answers.right.answer);
      })
      .subscribe('round:updateLifeBar', (hp) => {
        this.view.render('life-bar', 'css', { width: `${hp}%` });
      })
      .subscribe('round:updateLifeBarState', function (lifeBarState) {
        if (lifeBarState === 'normal') {
          this.view.render('life-bar', 'removeClass', 'life-bar--low');
          this.view.render('life-bar', 'removeClass', 'life-bar--critical');
        } else if (lifeBarState === 'low') {
          this.view.render('life-bar', 'removeClass', 'life-bar--critical');
          this.view.render('life-bar', 'addClass', 'life-bar--low');
        } else if (lifeBarState === 'critical') {
          this.view.render('life-bar', 'removeClass', 'life-bar--low');
          this.view.render('life-bar', 'addClass', 'life-bar--critical');
        }
      })
      .subscribe('round:newTaunt', (taunt, type) => {
        //this.view.render('taunt', 'removeClass', 'active');
        this.view.render('taunt', 'html', taunt);

        if (type === 'mean') {
          this.view.render('bloody', 'addClass', 'u-no-transition');
          this.view.render('bloody', 'addClass', 'active');
          this.view.render('bloody', 'removeClass', 'u-no-transition');
        }

        let self = this;
        setTimeout(() => {
          //self.view.render('taunt', 'addClass', 'active');
          if (type === 'mean') self.view.render('bloody', 'removeClass', 'active');
        }, 200);
      })
      .subscribe('round:gameOver', (score) => {
        let template = '';

        score.forEach((point) => {
          if (point === 1) template += '<span class="point point--right"></span>\n';
          else template += '<span class="point point--wrong"></span>\n';
        });

        this.view.render('score-board', 'html', template);


        // update href attribute of tweet button
        let points = score.join('').match(/1/g);

        if (points) points = points.length;
        else points = 0;

        let baseUrl      = 'https://twitter.com/home?status=';
        let tweetMessage = encodeURIComponent(`Boom! Just made a score of ${points}, come and beat me! #logicalornot http://gabinaureche.com/logicalornot via @zh0uzi`);

        this.view.render('tweet-my-game-button', 'attr', { href: baseUrl + tweetMessage });


        // Show modal
        this.view.render('modal', 'removeClass', 'u-hide');

        let self = this;
        setTimeout(() => self.view.render('modal', 'addClass', 'active'), 100);
      })
      .subscribe('view:newRound', () => {
        this.newRound();
      })
      .subscribe('view:selectAnswer', (answer) => {
        this.round.submitAnswer(answer);
      })
    ;
  }

  newRound () {
    if (this.round) {
      if (this.round.status === 'game over') {
        this.view.render('modal', 'removeClass', 'active');

        let self = this;
        setTimeout(() => self.view.render('modal', 'addClass', 'u-hide'), 500);
      }

      this.round.stop();
    }

    this.round = new RoundClass(this.questions, this.taunts, this.stream);
  }
}
