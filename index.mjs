import express from 'express';
import dotenv from 'dotenv';
const vars = dotenv.config()
const app = express();
const port = process.env.PORT;

//gen access token for spotify

//send post request for user playlist and send access token in auth

//turn response into object made up of arrrays that contain each songs - Title, Artist, Year

//at this point give user feedback to ask if they meant to choose this playlist

//gen access token for souncloud

//send request to create a playlist

//check that the playlist was made successfully 

//loop object and search for soundcloud link to current song  
//  -if there are no matching results, save those that didn't match in a seperate array and present this to the user
//  -to match the song, use soundcloud's search api feature with the tile and artist (year if necessary)

//once a match is found add each link to the new playlist created==



app.get('/', (req,res) => {
    res.status(200).send("Hello");
})

app.listen(port, {})