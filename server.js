const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const port = 9000;

router.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/index.html'));
  //__dirname : It will resolve to your project folder.
});

//add the router
app.use('/', router);
// Indicate where static files are located. Without this, no external js file, no css...  
app.use(express.static(__dirname + '/'));       

app.listen(port, () => {
  console.log("Server is running on port", port);
});


