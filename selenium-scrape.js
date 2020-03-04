const cheerio = require('cheerio');

const webdriver = require('selenium-webdriver'),By = webdriver.By,until = webdriver.until;
var gamesElement;
var driver = new webdriver.Builder()
  .forBrowser('chrome')
  .build();
setPageForLiveData();
//When running file it will open directly live data page
//You can set up functions as you want to extract data

//setPageForNormalData and setPageForLiveData are setting pages
//captureLiveData and captureNormalData are for capturing live and 24 hour games
//hm-MainHeaderCentreWide 

async function setPageForNormalData(){
  await driver.get('https://www.bet365.com/#/IP');  
  await driver.wait(until.elementLocated(By.className('wn-WebNavModule ')));
  var el = await driver.findElements(By.className('wn-Classification'));

  for(let e of el){

    if((await e.getText()) == "Soccer"){
      e.click();
      break;
    }
  }
  await driver.wait(until.elementLocated(By.className('sl-ClassificationHeader_PeriodSelect')));

  var hr12 = await driver.findElements(By.className('sm-UpComingFixturesMultipleParticipants_Region'));
  hr12[1].click();

  await driver.wait(until.elementLocated(By.className('scr-ScrollableHorizontalNavBar_ButtonContainer scr-NavBarScroller_ScrollContent cl-MarketGroupHorizontalNavBar_ButtonConatiner ')));
  var openedMarkets = await driver.findElements(By.className('gll-MarketGroup_Open'));
  
  var competitionButtons = await driver.findElements(By.className('ufm-MarketGroupButtonUpcomingCompetition'));
  var index = 1;
  for(let c of competitionButtons){

      await driver.executeScript("arguments[0].scrollIntoView(true);", c);
      await driver.executeScript("arguments[0].click();", c);
  }

  for (let p of openedMarkets){
    await driver.executeScript("arguments[0].scrollIntoView(true);", p);
    await driver.executeScript("arguments[0].click();", p);
  }

  //setPageForLiveData();
  
  //setPageForLiveData();
 

}

async function captureNormalData(){
  var todayGames = [];
  var allGames = await driver.findElement(By.className('cm-CouponModule'));
  var $game = cheerio.load(await allGames.getAttribute('innerHTML'));
  var time, gameName, league, ltScore, vtScore;
  $game('.sl-CouponParticipantWithBookCloses').each(function(i,e){
      league = e.parent.children[0].children[0].data;
      time = e.children[0].children[0].children[0].data;
      ltScore = 0;
      vtScore = 0;
      
      
      children = e.children[1].children;
      if(time == undefined){
        time = "Alredy started";
        var score = (children[1].children[0].children[0].data).split('-');
        ltScore = parseInt(score[0]);
        vtScore = parseInt(score[1]);
      }
      if(children.length > 1){
        gameName = children[0].children[0].data +" v "+children[2].children[0].data;
      }else{
        gameName = children[0].children[0].data
      }

      
      todayGames.push({
        league,
        time,
        gameName,
        ltScore,
        vtScore
      });
      
  });
console.log(todayGames);
  return todayGames;



}

async function setPageForLiveData(){
    await driver.get('https://www.bet365.com/#/IP');  
    await driver.wait(until.elementLocated(By.className('hm-MainHeaderCentreWide')), 50000);
    var sports = await driver.findElements(By.className('hm-MainHeaderCentreWide_Link'));
    for (let sport of sports) {
      if ((await sport.getText()) == "In-Play") {
        await sport.click();
        break;
      }
    }

    gamesElement = await driver.wait(until.elementLocated(By.className('ipo-CompetitionRenderer')), 50000);
    

}

async function startCapturingLiveData() {
  try {

    var gamesHTML = await gamesElement.getAttribute('innerHTML');
    return organizeData(gamesHTML);

  } catch (err) {
    console.log(err);
  }

}

function organizeData(html) {
      //ipo-ScoreDisplayStandard_Wrapper 
      var games = [];
      var $ = cheerio.load(html);
      $('.ipo-ScoreDisplayStandard_Wrapper').each(function (i, e) {

          var time = (e.children[0].children[0].data);
          if(time != undefined){
            time = time.split(":");
          }else{
            time = [];
            time[0] = 90;
            time[1] = 0;
          }
          var lt = e.children[1].children[0].children[0].children[0].data;
          var vt = e.children[1].children[1].children[0].children[0].data;
          var ltScore = e.children[2].children[0].children[0].children[0].data;
          var vtScore = e.children[2].children[0].children[1].children[0].data;
          var league = e.parent.parent.parent.parent.parent.children[0].children[0].children[0].children[0].data;
          var minute = time[0];
          var second = time[1];
          var status = "LIVE";

          if (minute == 0 && second == 0) {
              status = "NOT STARTED";
          }
          games.push({league, lt, vt, minute, second, status, ltScore, vtScore});
         
        });

        return games;

}

module.exports.setPageForLiveData = setPageForLiveData;
module.exports.setPageForNormalData = setPageForNormalData;
module.exports.captureNormalData = captureNormalData;
module.exports.startCapturingLiveData = startCapturingLiveData;