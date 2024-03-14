# healthcheck
Personal DiscordOps to keep things I deploy in check

## Configuration

A configuration file should be manually pushed and made accessible to the functions. This can be done via `netlify blobs:set test config -i ./config.json` provided that `config.json` has content that matches the configuration schema:

```
{
  "endpoints": [
    { "name": <service-name>, "url": <endpoint-url> },
    ...
  ],
  "webhook_url": <webhook-url>
}
```

The `webhook-url` is expected to contain `$DISCORD_WEBHOOK_ID` and `$DISCORD_WEBHOOK_TOKEN` placeholders.
