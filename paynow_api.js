console.log('Server Starting...');

const express = require('express');
const bodyParser = require('body-parser');
const PaynowQR = require('paynowqr');
const QRCode = require('qrcode');
const sharp = require('sharp');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8001;

const uen = '201608445Z';
const receiver_name = 'ACES CARE Limited';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.get('/paynow/:amount/:ref', function (req, res) {
  var amount = req.params.amount;
  var ref = req.params.ref;

  var random_num = Math.floor(Math.random() * 1000000000000001 + 1);
  var currentTime = new Date().getTime();
  var currentDate = new Date(currentTime);

  function padZero(num) {
    return num < 10 ? `0${num}` : num;
  }
  const formattedTime = `${currentDate.getFullYear()}-${padZero(
    currentDate.getMonth() + 1
  )}-${padZero(currentDate.getDate())} ${padZero(
    currentDate.getHours()
  )}:${padZero(currentDate.getMinutes())}:${padZero(currentDate.getSeconds())}`;

  // Print the formatted date and time
  console.log(`Ref:${ref} | $${amount} | ${formattedTime}`);

  let qr_code = new PaynowQR({
    uen: uen,
    amount: amount,
    editable: false,
    expiry: '',
    refNumber: ref,
    company: 'ACES CARE',
  });
  console.log(qr_code.output());
  QRCode.toBuffer(qr_code.output(), function (err, buffer) {
    if (err) {
      return res.status(500).send('Error Occurred');
    }
    sharp(buffer)
      .resize(500, 500)
      .toBuffer()
      .then((newBuffer) => {
        let imgSrc = 'data:image/png;base64,' + newBuffer.toString('base64');
        console.log(newBuffer.toString('base64'));
        console.log(imgSrc);
        let html = `
          <html>
            <head>
              <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500&display=swap" rel="stylesheet">
            </head>
            <body style="text-align: center; background-color: black; color: white; font-family: 'Montserrat', sans-serif;">
              <div style="width: 500px; margin: auto;">
                <img src="${imgSrc}" alt="" style="width: 100%;"/><br/>
                <p style="font-size: 32px; text-align: left; padding-top: 30px; padding-left: 10px; margin: 0;"><strong>${receiver_name}</strong></p>
                <p style="font-size: 24px; text-align: left; padding-top: 5px; padding-left: 30px; margin: 0;">UEN: <strong>${uen}</strong><br/>Amount: <strong>$${amount}</strong></p>
              </div>
              <script>
                window.onload = function() {
                    var randomNum = ${random_num};
                    var currentTime = ${currentTime};
                    var newUrl = window.location.href;
                    var hasNoCache = newUrl.includes('no_cache');
                    if (hasNoCache) {
                        newUrl = newUrl.replace(/(no_cache=)[^\&]+/, '$1' + currentTime + "." + randomNum);
                    } else {
                        newUrl += (window.location.search === "" ? "?" : "&") + "no_cache=" + currentTime + "." + randomNum;
                    }
                    window.history.replaceState({}, document.title, newUrl);
                }
              </script>
            </body>
          </html>`;
        res.send(html);
      })
      .catch((err) => {
        res.status(500).send('Error Occurred');
      });
  });
});

app.get('/', (req, res) => {
  res.send('Welcome to the Node.js Server!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
