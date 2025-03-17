import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import querystring from 'query-string';
import jsonwebtoken from 'jsonwebtoken'
import fs from 'fs';

const vars = dotenv.config()
const app = express();
const port = process.env.PORT
app.set("view engine", "ejs")
const __dirname = process.cwd();
app.use(express.static(__dirname+'\\views'))
/**
 * Middleware that parses and encodes json
 */ 
app.use(bodyParser.json() );     
app.use(bodyParser.urlencoded({ extended: true })); 

app.get('/', (req,res) => {
    res.status(200).render(__dirname+"\\views");
})

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = 'http://127.0.0.1:3000/callback';

app.get('/refresh_token', async (req,res) => {
  try{
    if (process.env.REFRESH_TOKEN_1 === undefined){
      res.send("NO token provided. Try log in again")
    }

    let req = process.env.REFRESH_TOKEN_1;
    const response= await fetch('https://accounts.spotify.com/api/token', {
      method:"POST",
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))        
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: req
      }) ,
    })
  }
  catch(e){
    console.log("e")
  } 
})

app.get('/log_on_spotify', (req,res) => { 
var state = generateRandomString(16);
var scope = 'user-read-private user-read-email';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', async function(req, res) {
    var code = req.query.code || null;
    var state = req.query.state || null;
    if (state === null) {
      res.redirect('/#' +
        querystring.stringify({
          error: 'state_mismatch'
        }));
    } else {
      try{
      const x = Buffer.from(client_id + ':' + client_secret).toString('base64');
      const response = await fetch('https://accounts.spotify.com/api/token',{
          method:"POST",
          body: new URLSearchParams({
            code: code, // Ensure this is the code you received in the authorization redirect
            redirect_uri: redirect_uri, // Ensure this matches the one used in the auth request
            grant_type: 'authorization_code',
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + x, // Base64-encoded client_id:client_secret
            },
      })
      const y= await response.json();
      process.env.ACCESS_TOKEN = y.access_token;
      process.env.REFRESH_TOKEN_1 = y.refresh_token;
      res.status(200).render(__dirname+"\\views\\logonpage.ejs");
    } catch (error){
      console.log("error fetching request")
    }

    }
  });

let userid = null;

app.get('/profile', async(req,res) => {
  try{
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: 'Bearer ' + process.env.ACCESS_TOKEN,
      }
      })
      const profile = await response.json();
      userid = profile.id;
      res.status(302).send(profile)
      return profile
    }
    catch{
    }
});

app.get('/playlists', async(req,res) => {
  try{
    const result = await fetch(`https://api.spotify.com/v1/users/${userid}/playlists`, {
        method: "GET", headers: {Authorization: `Bearer ${process.env.ACCESS_TOKEN}`}  
    });

    const profile = await result.json();
    res.status(302).send(profile)
  }
  catch{
    console.log("error")
  }
})

app.post('/convertplaylist',async(req,res) => {
  getSpotifyTracks(req.body.playlistid)
  
  //prompt user to log into apple music

  //promp user for new playlist name

  //begin the process of converting

  //once there is a basic working app then the process really starts of improving and getting rid of bugs

})



let currentPlaylistArray = new Array();
let currentPlaylistMap = new Map();
async function getSpotifyTracks(playlistid){
  try{
    const result = await fetch(`https://api.spotify.com/v1/playlists/${playlistid}`, {
        method: "GET", headers: {Authorization: `Bearer ${process.env.ACCESS_TOKEN}`}  
    });
    const profile = await result.json();
    const totalTracks = profile.tracks.total;
    //javascript let me down because of the non type safety and i dont know how js runs code
    for (let i = 0; i <= totalTracks -1; i++){
      currentPlaylistArray.push(profile.tracks.items[i].track.name)
      if (profile.tracks.items[i].track.artists[0].name != null){
        currentPlaylistMap[profile.tracks.items[i].track.name] =  profile.tracks.items[i].track.artists[0].name;
      }
      else{
        currentPlaylistMap[profile.tracks.items[i].track.name] =  "";
      }
    }
    getAppleToken();
  }
  catch{
    console.log("error")
  }
}

async function getAmToken(){
  
}

async function getPlaylistName(){

}

async function createAmPlaylist(){

}

async function addToAmPlaylist(){
  
}

async function getAppleToken(){ 
  try{
    let date = new Date();
    let iat = date;
    console.log((iat * 1))

    const header = {
        kid: "bdef4554463d8078be9af1d9de55"
    }
    const payload = {
      "iss": "DEF123GHIJ",
      "iat": 1437179036,
      "exp": 1493298100
    }    
    const privateKey = fs.readFileSync("./AuthKey_AUW2Y6ZP3F.p8");
    let token = jsonwebtoken.sign(payload, privateKey, { header: header, algorithm: "ES256" });
    console.log(token)

    let req = new Request("https://api.music.apple.com/v1/test", {
      method:"POST",
      headers: {
          'Authorization': 'Bearer '+ token
      },
    });
    console.log(await fetch(req))
  }
  catch (err){
    console.log(err)
  }
}


function generateRandomString(length){
    let result='';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
} 


app.listen(port, {})