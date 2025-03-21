import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import querystring from 'query-string';
import jwt from 'jsonwebtoken'
import fs from 'fs';
import crypto from 'crypto';

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
let currentPlaylistArray = new Array();
let currentPlaylistMap = new Map();

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

let playlistid = ""

app.post('/convertplaylist',async(req,res) => {  
  playlistid = req.body.playlistid;
  const redirect_uri_sound = "127.0.0.1:3000/soundcloudcallback".toString('base64');
  const state = generateRandomString(60);
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID
  const code_verifier = crypto.pseudoRandomBytes(65).toString('base64');
  const codeChallenge = crypto
  .createHash('sha256')
  .update(code_verifier)
  .digest('base64') // Convert to base64
  .replace(/\+/g, '-')  // Replace "+" with "-"
  .replace(/\//g, '_')  // Replace "/" with "_"
  .replace(/=+$/, '');  // Remove padding
  const params =  new URLSearchParams({
    client_id: clientId, 
    redirect_uri: redirect_uri_sound,
    code_challenge:codeChallenge,
    code_challenge_method:"S256",
    response_type: 'code',  // Added the missing response_type parameter
  });
  console.log(codeChallenge)
  console.log(code_verifier)

  const url=`https://secure.soundcloud.com/authorize?${params.toString()}`;
  try{
    res.set("Allow-Control-Access-Origin","http://127.0.0.1:3000")

    res.redirect(url)
  }
  catch (error){
    console.log(error)
  }
})


app.post('/soundcloudcallback', async(req,res)=>{

  res.status(200).send("hello")
})


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
        currentPlaylistMap[profile.tracks.items[i].track.name] = profile.tracks.items[i].track.artists[0].name;
      }
      else{
        currentPlaylistMap[profile.tracks.items[i].track.name] =  "";
      }
    }
    return currentPlaylistMap;
  }
  catch{
    console.log("error")
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