import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertController, Platform, ModalController} from 'ionic-angular';
import { QuizPage } from '../quiz';
import { Student } from '../../../services/student.model';
import { AngularFireDatabase } from 'angularfire2/database';
import { AuthServiceProvider } from '../../../services/auth.service';
import moment from 'moment';
import { BarcodeScanner } from "@ionic-native/barcode-scanner";
import { Identifiers } from '@angular/compiler';
import { ScanQuizPage } from '../scan-quiz/scan-quiz';

@Component({
  selector: 'page-quiz-modal',
  templateUrl: 'quiz-modal.html',
})
export class QuizModalPage {
  //navParams
  course_id : String;
  course_name : String;
  status: String;
  quiz_id: String;
  activity : {id: '', name: ''};
  totalScore : Number;
  //Model & List
  studentList: Student[];
  scheduleQuizList: any;
  studentCount : Number;
  //Val
  scoreSelect : Number;
  scoreRangeArr : any = [];
  structure = {lower: 0, upper: 0};
  studentFlag: boolean = false;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public viewCtrl: ViewController,
    private auth: AuthServiceProvider,
    private db: AngularFireDatabase,
    private barcodeScanner: BarcodeScanner,
    public alertCtrl: AlertController,
    public platform: Platform,
    public modalCtrl: ModalController) {

      this.course_id = navParams.get('course_id');
      this.course_name = navParams.get('course_name');
      this.status = navParams.get('status');
      this.quiz_id = navParams.get('quiz_id');
      this.activity = navParams.get('activity');
      this.totalScore = navParams.get('totalScore');
      this.structure = {lower: 1, upper: 10};
      console.log(this.activity)

      const coursePath = `users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/${this.activity.id}`;
      const studentPath = `users/${this.auth.currentUserId()}/course/${this.course_id}/students`;

    //Query scheduleQuizList
    this.db.list(coursePath).snapshotChanges().map(actions => {
      return actions.map(action => ({ key: action.key, ...action.payload.val() }));
      }).subscribe(items => {
        this.scheduleQuizList = items;
        //this.totalScore = this.scheduleQuizList.totalScore;
        return items.map(item => item.key);
      });

    //Query Student
    this.db.list(studentPath).snapshotChanges().map(actions => {
      return actions.map(action => ({ key: action.key, ...action.payload.val() }));
      }).subscribe(items => {
        this.studentList = items;
        this.studentCount = this.studentList.length;

          return items.map(item => item.key);
      });

      let temp = Number(this.structure.upper);
      for(var i=Number(this.structure.upper) ; i>=Number(this.structure.lower) ; i--){
        this.scoreRangeArr.push(temp);
        temp = temp-1;
      }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad QuizModalPage');
  }

  public closeModal(){
    this.viewCtrl.dismiss('close');
  }

  public update() {
    this.scoreRangeArr = [];
    let temp = Number(this.structure.upper);
    for(var i=Number(this.structure.upper) ; i>=Number(this.structure.lower) ; i--){
      this.scoreRangeArr.push(temp);
      temp = temp-1;
    }
  }

  /////////////////////////////////////////////////////////////////////
  // ON Click Scan
  /////////////////////////////////////////////////////////////////////
  public onClickScan(){
    console.log(this.status)
    if(this.scoreSelect == undefined || this.scoreSelect == null || this.scoreSelect == 0 ){
      this.alertErrorScore();
    }else if(this.scoreSelect <= 0){
      this.alertErrorMinusScore();
    }else if(Number(this.scoreSelect) > Number(this.totalScore)){
      this.alertErrorTotalScore();
    }else{
      //this.totalScoreSet();
      if(this.status == '0'){
        console.log('toCreate');
        this.createNewQuiz();
      }else if(this.status == '1'){
        console.log('toRepeat'+this.quiz_id);
        //this.scanQR(this.quiz_id);
        this.pushToScanPage(this.quiz_id);
      }else if(this.status == '2'){
        console.log('toRepeatString'+this.quiz_id);
        //this.scanQR(this.quiz_id);
        
        this.pushToScanPageString(this.quiz_id);
      }
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
      subTitle: this.scoreSelect+"/"+this.totalScore+"<br>คะแนนที่กำหนด ห้ามมากกว่าคะแนนเต็ม",
      buttons: ['OK']
    });
    alert.present();
  }

  /////////////////////////////////////////////////////////////////////
  // Set Default 
  /////////////////////////////////////////////////////////////////////
  createNewQuiz(){
    let dateId = moment().format("YYYY-MM-DD-HH-mm-ss"); 

    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/${this.activity.id}/${dateId}`)
        .update({
          id : dateId,
          date : Date(),                                                         
          count : 0,
          totalScore : this.totalScore
      });
    // Set 0 Score
    for(var i=0 ; i<this.studentList.length ; i++){
      this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/students/${this.studentList[i].id}/${this.activity.id}/${dateId}`)
        .update({
          score : 0,
      });
    }
 
    // then Scan
    //this.scanQR(dateId);
    this.pushToScanPage(dateId);
  }

  /////////////////////////////////////////////////////////////////////
  // Scan
  /////////////////////////////////////////////////////////////////////
  pushToScanPage(id){
    let dataList = 
      { key : 'set',
        quiz_id : id,
        totalScore : this.totalScore,
        scoreSelect : this.scoreSelect
      }
    let scan = this.modalCtrl.create(ScanQuizPage, 
      { 
        activity : this.activity,
        course_id : this.course_id,
        dataList : dataList,
    });
    scan.onDidDismiss(data => {
      this.closeModal();
    });
    scan.present();
  }

  pushToScanPageString(id){
    let dataList = 
      { key : 'stringSet',
        quiz_id : id,
        totalScore : this.totalScore,
        scoreSelect : this.scoreSelect
      }
    let scan = this.modalCtrl.create(ScanQuizPage, 
      { 
        activity : this.activity,
        course_id : this.course_id,
        dataList : dataList,
    });
    scan.onDidDismiss(data => {
      this.closeModal();
    });
    scan.present();
  }

}
