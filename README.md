### How to deploy a NodeJS server on Zeits Now platform ▲

*I’ve decided to write this article because when I was working on this goal, I
couldn’t find that many resources, besides the *[docs of Zeit
Now](https://zeit.co/docs/api)* themselves.*

The goal is to deploy a NodeJS **server** application, for instance an Express
server, to [Zeits Now](https://zeit.co/now) platform and publish it to an [AWS
Route53](https://aws.amazon.com/route53/) subdomain. I’ll go with an Express
repo, since I think that’s a viable use case.

### Setting up an Express project

If you want to know a bit more about setting up an Express application, I
recommend [this guide by the Mozilla
Foundation](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs).
In our example, where simply going to build a very simple weather API, which
pulls from a DarkSky API.

#### Let’s get started!

Initialize a project with:

    $ npm init

If the then install the following packages, you’re good to go:

    $ npm install express node-fetch && npm install --save-dev nodemon

The nodemon package makes sure the NodeJS script gets restarted automatically
when it detects changes. While we’re at it, let’s add a development script to
the *package.json* file (add it to the “scripts” property):

    // omitted stuff for the sake of brevity...

    "scripts": {
      "start": "nodemon node index.js"
    }

    // ...omitted more stuff for the sake of brevity

This way, you can run your Node script with the command:

    $ npm run start

There’s nothing to start though, so let’s create an application. First, sign up
for an API key at [https://darksky.net/dev](https://darksky.net/dev). Obviously,
you’ll be needing that key!

Next, save the contents of the following file as *index.js*:

    const express = require("express");

    const app = express();
    const port = 4000;

    async function getWeather() {
      const config = {
        secret: "INSERT_YOUR_SECRET_HERE",
        location: "52.238,5.5346", // This is NL, welcome!
        lang: "en",
        units: "si",
        exclude: "minutely,hourly,daily,alerts,flags"
      };

      const weatherAPI = `
    config.location}?lang=${config.lang}&units=${config.units}&exclude=${config.exclude}`;

      const response = await fetch(weatherAPI);
      return response.json();
    }

    app.get("/", (req, res) => {
      getWeather().then(weather => {
        res.json(weather);
      });
    });

    const server = app.listen(port);

After you’ve inserted the DarkSky secret, you should be able to get a weather
report for The Netherlands by running the server via de start script:

    $ npm run start

The application will run on the following URL:
[http://localhost:4000](http://localhost:4000/). Enjoy our typical Dutch
weather! ☔️

*****

### First deploy

Now, to deploy this API to the world! Install the Now CLI globally via npm:


In order to let Now know that it should host and build a NodeJS application,
create the following *now.json* file in your projects’ folder:

    {
      "version": 2, // Tells Now which API version to use
      "builds": [
        {
          "src": "*.js",
          "use": "
    " // It's an application!
        }
      ]
    }

This file is being read on deployment and tells Now which version of their API
you’ll want to use (**only version 2 supports node servers**), what files to
look for on build, and what type of hosting environment to use.

Also, add a *.nowignore* file with the following entry to exclude the
node_modules folder:

    node_modules

Finally, do your first deploy run running the deployment command in your
projects’ folder:

    $ now

The first time you do this, you’ll need to register a bit with Zeit. Just follow
the steps until you’re done, then you’ll shoot your project to a generated
subdomain of the now.sh servers! 🚀

Feel free to visit the successful deployment of your API. Getting an error? Read
on! 👇

#### Dealing with errors

I’ve received an error, and I am not sure what went wrong. This seems like a
good opportunity to take a look at some logs, to try and resolve it:

    $ now logs URL_OF_FAILED_DEPLOYMENT_HERE

This way, you can take a look at the build that was executed by your command.

*****

### Dealing with environment variables and secrets

To alternate settings between your development and online production
environments, you can use environmental variables. We are going to use these to
toggle some features in the application. We are also going to obfuscate the API
secret from DarkSky. (*Strictly, this isn’t required, since the API key is not
directly exposed to the public. But would you add this code to a versioning
system, it is good practice to exclude all sorts of keys and secrets from your
application, to prevent misuse.*)

#### Environment variables

Now provides a variable (*process.env.now*) on deployment, which we can use to
toggle some features. Install the dotenv package with:

    $ npm install dotenv --save-dev

Make the following changes to your *index.js*:

    // index.js, line 1:
    if (!process.env.now) require("dotenv").config();

    // ...removed some code for brevity

    // index.js, line 7:
    const port = process.env.now ? 8080 : 4000;

Try a new deploy with those code changes:

    $ now

You should be able to visit your API now on the deployed URL on now.sh! 🙌

#### Secrets 🤫

How about them secrets huh? In our example application, we have one variable you
can consider a secret: the DarkSky API key. To work locally with secrets, you
usually create a *.env* file in your folder which you **exclude from version
control**. Store this line in your .env file:

    darksky_secret=some_random_secret9f3c9a26798255

Change the *config* part to change the secret reference to match this:

    const config = {
      secret: process.env.darksky_secret, // Now pointed to the env vars
      location: "52.238,5.5346",
      lang: "en",
      units: "si",
      exclude: "minutely,hourly,daily,alerts,flags"
    };

Test your local server, this should still work as expected. This file does **not
get published to Now**, so you’ll need [a different means of providing these
variables](https://zeit.co/docs/v1/getting-started/environment-variables/).

*Note: The docs state different means of making the variable available during
build, but I found only the following combination worked for me.*

Push the secret to Now with the following command (secrets are shared on the
account level. Make sure they’re good names!):

    $ now secrets add darksky_secret "some_random_secret9f3c9a26798255"

Open up the *now.json* file and append the “*build*” property with the required
*env*-variables:

    {
      "version": 2,
      "builds": [
        {
          "src": "*.js",
          "use": "
    "
        }
      ],
      "build": {
        "env": {
          "darksky_secret": "
    "
        }
      }
    }

That *should* be it, but I haven’t been able to get it working just yet. I added
the following step to make it work: When deploying, reference the secrets via
the command:

    now -e darksky_secret=
    darksky_secret

I think the command has a similar means as the config in the *now.json* file,
but this combination seems to work. So, oh well… This is some lengthy typing, so
I added a “deploy” script to my *package.json*:

    // omitted stuff for the sake of brevity... 
    "scripts": {
      "start": "nodemon node index.js",
      "deploy": "now -e darksky_secret=
    "
    },
    // ...omitted more stuff for the sake of brevity

*****

### Aliasing deploys

By this time, you might have noticed that every deploy, a new subdomain got
generated. That’s not very useful for public facing addresses! Luckily, you can
fairly easily alias the domain. The documentation details [how to alias a
domain](https://zeit.co/docs/v2/domains-and-aliases/aliasing-a-deployment/)
hosted by Now, but in my case, I needed to alias an AWS domain.

In the example, we’re going to use the domain: my-example.com in order to alias
the NodeJS server to https://weather.my-example.com (heyo, Now automagically
issues a certificate to the domain).

After deployment, use the CLI to start setting up the alias:

    now alias YOUR_LAST_DEPLOYMENT_URL weather.my-example.com

You will need to verify your custom domain, so flip over to Route53!

Once logged onto the [AWS Console](https://console.aws.amazon.com/route53/home),
add at least these two record sets: 

Add Zeits World DNS servers:

* Name: <br> *weather*
* Type:<br> *A -  IPv4 Address*
* Alias:<br> *No*
* Value:<br> *46.31.236.196.45.80.143.247.170.143.247.171.196.45.81.146.31.237.1*

Second, add an alias in Route53 to point to Zeit:

* Name: <br> *weather*
* Type:<br> *CNAME - Canonical name*
* Alias:<br> *No*
* Target Alias:<br> *alias.zeit.co*

It might be necessary to verify the domain. In that case, you’ll need to add a
type “*Text*” to your Route53 configuration. After the external domain has been
verified by Zeit, you can remove that record if you like.

Give it some time (a couple of minutes) to propagate, you should be good. The
fastest way to reinitialize is to simply rerun the last command from the CLI:

    now alias YOUR_LAST_DEPLOYMENT_URL weather.my-example.com

Now you should receive a success message, congrats! 🎉

*****

If you have any questions or remarks, feel free to contact me!