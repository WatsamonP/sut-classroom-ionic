import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertController} from 'ionic-angular';
import { QuizPage } from '../quiz';
import { AngularFireDatabase } from 'angularfire2/database';
import { AuthServiceProvider } from '../../../services/auth.service';

@Component({
  selector: 'page-quiz-modal-person',
  templateUrl: 'quiz-modal-person.html',
})
export class QuizModalPersonPage {
  scoreSelect : Number;
  course_id : String;
  quiz_id : String;
  activity : {id: '', name: ''};
  barcodeData : String;
  countScan : Number;
  //scoreRange: Number ;
  scoreRangeArr : any = [];
  structure = {lower: 0, upper: 0};
  totalScore : Number;
  quizDataList : any;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public viewCtrl: ViewController,
    private auth: AuthServiceProvider,
    private db: AngularFireDatabase,
    public alertCtrl: AlertController) {

      this.quizDataList = navParams.get('quizDataList');
      this.course_id = this.quizDataList.course_id;
      this.quiz_id = this.quizDataList.quiz_id;
      this.barcodeData = this.quizDataList.barcodeData;
      this.countScan = this.quizDataList.countScan;
      this.activity = this.quizDataList.activity;
      this.totalScore = this.quizDataList.totalScore;
      this.structure = {lower: 1, upper: 10};
      console.log(this.totalScore);
      console.log(this.quizDataList);

      let temp = Number(this.structure.upper);
      for(var i=Number(this.structure.upper) ; i>=Number(this.structure.lower) ; i--){
        this.scoreRangeArr.push(temp);
        temp = temp-1;
      }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad QuizModalPersonPage');
  }

  public update() {
    this.scoreRangeArr = [];
    let temp = Number(this.structure.upper);
    for(var i=Number(this.structure.upper) ; i>=Number(this.structure.lower) ; i--){
      this.scoreRangeArr.push(temp);
      temp = temp-1;
    }
  }

  public closeModal(){
    this.updateQuiz(this.quiz_id, this.barcodeData, this.countScan);
    this.viewCtrl.dismiss('close');
  }

  /////////////////////////////////////////////////////////////////////
  // ON Click Save
  /////////////////////////////////////////////////////////////////////
  public onClickSave(){
    let score = Number(this.scoreSelect);
    if(this.scoreSelect == undefined || this.scoreSelect == null || this.scoreSelect == 0 ){
      this.alertErrorScore();
    }else if(this.scoreSelect < 0){
      this.alertErrorMinusScore();
    }else if(Number(this.scoreSelect) > Number(this.totalScore)){
      this.alertErrorTotalScore();
    }else{
      this.closeModal();
    }
  }

  /////////////////////////////////////////////////////////////////////
  // Alert
  /////////////////////////////////////////////////////////////////////
  alertErrorScore() {
    let alert = this.alertCtrl.create({
      title: 'ERROR !',
      subTitle: 'กรุณากรอกคะแนน',
      buttons: ['OK']
    });
    alert.present();
  }
  alertErrorMinusScore() {
    let alert = this.alertCtrl.create({
      title: 'ERROR !',
      subTitle: 'คะแนนต้องเป็นจำนวนบวก และมากกว่า 0 กรุณาแก้ไข',
      buttons: ['OK']
    });
    alert.present();
  }
  alertErrorTotalScore() {
    let alert = this.alertCtrl.create({
      title: 'ERROR !',
      subTitle: this.scoreSelect+'/'+this.totalScore+'<br>คะแนนที่กำหนด ห้ามมากกว่าคะแนนเต็ม',
      buttons: ['OK']
    });
    alert.present();
  }

  updateQuiz(id, barcodeDataText, countScan){
    let scoreNo = Number(this.scoreSelect);
    countScan = countScan+1;

    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/${this.activity.id}/${id}`)
    .update({
      count : countScan,
    });
    
    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/students/${barcodeDataText}/${this.activity.id}/${id}`)
      .update({
        score : scoreNo,
        date : Date(),
      });

    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/${this.activity.id}/${id}/checked/${barcodeDataText}`)
      .set({
        id : barcodeDataText,
    });
  }
}
