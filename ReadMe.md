## hook.io-pinger

*a Hook for pinging sites. useful for determining if a site is online or offline.*

## Installation

     npm install hook.io-pinger -g

## Usage

     hookio-pinger

## Hook Events Names

**siteDown** *event emitted when a site goes down*

**siteUp** *event emitted when a site comes back online from being down*

## Hook config.json settings
``` js

{ 
  "sites": [
   {
     "name": "Google",
     "url": "http://google.com/"
   },
   {
     "name": "Github",
     "url": "http://www.github.com/"
   }
  ]
}

```

## Required Hooks

  - [cron](http://github.com/hookio/cron)
  - [request](http://github.com/hookio/request)


