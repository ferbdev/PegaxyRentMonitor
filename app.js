const { Webhook, MessageBuilder } = require('discord-webhook-node');

var axios = require('axios');

var checkedHorses = [0];

const hook = new Webhook("https://discord.com/api/webhooks/935418365210656808/4_eQt5KGRP5uxrOGVN63RAhcl305IY5N6b-kjSaiddjUcApCBvbzRQ--f0gkPvG0JbV_");

const hook2 = new Webhook("https://discord.com/api/webhooks/941467672175050762/cViVIG9NdLfuO1Xy_-aL0jGv51pFAo8QceCf2OUydbxS33-JVjvk3Kh0vMl22X5IaDGo");

console.log('Iniciando bot');

//puppeteer.use(StealthPlugin());

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getFormattedDate() {
    var date = new Date();
    var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "." + date.getMilliseconds() + "- ";

    return str;
}

function DoLog(message) {
    console.log(getFormattedDate() + message);
}

function getRandomNumberBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function pad2(n) { return n < 10 ? '0' + n : n }

var date = new Date();

var vigValue;
var pgxValue;

function getStringDate(){
    var stringDate = date.getFullYear().toString() + pad2(date.getMonth() + 1) + pad2( date.getDate()) + pad2( date.getHours() ) + pad2( date.getMinutes() ) + pad2( date.getSeconds() ) + pad2( date.getMilliseconds() );
    return stringDate;
}

async function GetPrice(){
  var config = {
    method: 'get',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=vigorus&vs_currencies=brl',
    headers: { }
  };
  
  axios(config)
  .then(function (response) {
    console.log(JSON.stringify(response.data));

    var result = response.data.vigorus.brl;

    vigValue = result;
  })
  .catch(function (error) {
    console.log(error);
  });

  var config = {
    method: 'get',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=pegaxy-stone&vs_currencies=brl',
    headers: { }
  };
  
  axios(config)
  .then(function (response) {
    console.log(JSON.stringify(response.data));
    var result = response.data[Object.keys(response.data)[0]].brl;

    pgxValue = result;
  })
  .catch(function (error) {
    console.log(error);
  });
}

const sendDiscordMessage = async (sendHook, link, imageurl, profit, winrate, pgx, energy, duration, avgReward, color, title) => {
  if (sendHook != null){
      const embed = new MessageBuilder()
      .setAuthor('Pegaxy Robot')
      .setTitle(title)
      .setURL(link)
      .addField('Profit (R$)', profit, true)
      .addField('WinRate (%)', winrate)
      .addField('Average Vis/Race', avgReward)
      .addField('PGX', pgx)
      .addField('Energy', energy)
      .addField('Duration', duration)
      .setColor(color)
      .setThumbnail(imageurl)
      .setTimestamp();

      sendHook.send(embed);
  }
}

async function StartRunBot() {
    var config = {
        method: 'get',
        url: 'https://api-apollo.pegaxy.io/v1/game-api/rent/0?rentMode=PAY_RENT_FEE'
      };
      
      axios(config)
      .then(function (response) {
        //let horses = JSON.stringify(response.data);
        let horses = response.data;
        //console.log(Object.keys(horses.renting).length);

        let horse = horses.renting;

        checkHorses = horse.filter(user => !checkedHorses.includes(user.pegaId)); //65000000000000000000

        var horsesCount = Object.keys(checkHorses).length;
        console.log(horsesCount + " Cavalos encontrados");

        if(horsesCount > 0){
          checkHorses.forEach((item, index, arr)=>{

            checkedHorses.push(arr[index].pegaId);
            console.log(arr[index].pegaId);

            var duration = arr[index].rentDuration / 60 / 60;

            var listId = arr[index].id;

            var pegaImage = arr[index].pega.design.avatar;
            
            var priceLength = arr[index].price.length - 18;
            var price = arr[index].price.substring(0, priceLength);

            var energy = arr[index].pega.energy;

            var config = {
              method: 'get',
              url: 'https://api-apollo.pegaxy.io/v1/game-api/race/history/pega/' + arr[index].pegaId,
              headers: { }
            };

            axios(config)
            .then(function (response) {
              let history = response.data.data;
              
              let history3 = history.filter(position => position.position <= 3);

              var historyCount = Object.keys(history).length;

              if (historyCount < 100){
                return;
              }

              var history3Count = Object.keys(history3).length;

              var winRate = history3Count / historyCount * 100;
              
              var result = [];
              history.reduce(function(res, value) {
                if (!res[value.position]) {
                  res[value.position] = { position: value.position, reward: 0 };
                  result.push(res[value.position])
                }
                res[value.position].reward += value.reward;
                return res;
              }, {});
              
              console.log("Cavalo " + arr[index].pegaId, result);

              var totalReward = result.reduce((accumulator, current) => accumulator + current.reward, 0);

              var averageReward = totalReward / historyCount;

              var spendPGX = pgxValue * price;

              var profitVis = averageReward * (energy + 23);

              var VisReal = profitVis * vigValue;

              var profit = VisReal - spendPGX;

              var costBenefit = profit / price;

              var color;
              var title;

              if (costBenefit >= 3) {
                color = '#24cf11';
                title = 'PEGAXY [A+]';
              }
              else
              if (costBenefit >= 2) {
                color = '#80cf11';
                title = 'PEGAXY [A]';
              }
              else
              if (costBenefit >= 1) {
                color = '#bfcf11';
                title = 'PEGAXY [B+]';
              }
              else
              if (costBenefit <= 1) {
                color = '#cfb311';
                title = 'PEGAXY [B]';
              }

              console.log("Total vis", totalReward);

              console.log("WinRate", winRate + "%");

              console.log("Average reward", averageReward);

              console.log("Duration", duration);

              console.log("Price", price);

              console.log("Energia", energy);

              console.log("Vis price", vigValue);

              console.log("PGX price", pgxValue);

              console.log("Profit", profit);

              profit = profit.toFixed(2);

              winRate = winRate.toFixed(2);

              if ((duration <= 24 && profit >= 80) || profit >= 1000){
                console.log("profitou");
                sendDiscordMessage(hook, "https://play.pegaxy.io/renting/listing/" + listId, pegaImage, profit + " brl", winRate + "%", price.toString(), energy.toString(), duration.toString(), averageReward.toString(), color, title);
              }

              if ((duration >= 48 && duration <= 36) && profit >= 400){
                console.log("profitou");
                sendDiscordMessage(hook2, "https://play.pegaxy.io/renting/listing/" + listId, pegaImage, profit + " brl", winRate + "%", price.toString(), energy.toString(), duration.toString(), averageReward.toString(), color, title);
              }

            })
            .catch(function (error) {
              console.log(error);
            });
          });
        }
        
      })
      .catch(function (error) {
        console.log(error);
      });

    //await sleep(10);
}

GetPrice();

setInterval(async ()=>{
    
  await GetPrice();

}, 10000);

setInterval(async ()=>{
    
    await StartRunBot();

}, 3000);