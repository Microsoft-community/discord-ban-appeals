# Discord Ban Appeals

This is a form which allows users to appeal their bans from a Discord server.

By using OAuth2, it ensures users can't forge or fake appeals.

## How do I use this?

1. Create an application on the [Discord Developer Portal](https://discord.com/developers/applications).

2. In the **Bot** section of the newly created application's dashboard, create a bot account and invite it to your server with the **Ban Members** permission.  
   > **Pro tip**: Use the **URL generator** under the **OAuth2** section of the Developer Portal dashboard for your application to generate the invite link. Make sure to select the **`bot`** scope!

3. In your server, create a channel dedicated to ban appeals. Ensure only mods and the bot can view the channel, and that the bot has the **Send Messages** and **Embed Links** permissions for this channel.  
   ![](https://cdn.discordapp.com/attachments/688870664941076514/743300978119278642/unknown.png)

4. In Discord's settings, go in the **Appearance** section and enable **Developer Mode**. You will need it soon.  
   ![](https://cdn.discordapp.com/attachments/688870664941076514/743301339752169522/unknown.png)

5. Click this button:  
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMicrosoft-community%2Fdiscord-ban-appeals&env=DISCORD_CLIENT_ID,DISCORD_CLIENT_SECRET,DISCORD_BOT_TOKEN,DISCORD_PUBLIC_KEY,GUILD_ID,APPEALS_CHANNEL,JWT_SECRET&envDescription=Environment%20variables%20required%20for%20the%20form%20to%20function.&envLink=https%3A%2F%2Fgithub.com%2FMicrosoft-community%2Fdiscord-ban-appeals%23how-do-i-use-this&project-name=discord-ban-appeals&demo-title=Discord%20Ban%20Appeals&demo-description=A%20sample%20ban%20appeal%20form%20for%20Discord%20with%20OAuth2%20support.)

6. In the web page that shows, login to your GitHub, GitLab or Bitbucket account. Create a repo for your form with your name of choice, then fill in these environment variables:
   | Variable Name          | Instructions                                                                                                               |
   | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------|
   | DISCORD_CLIENT_ID      | Copy it from the **OAuth2** section of your application in the Developer Portal.                                           |
   | DISCORD_CLIENT_SECRET  | Copy it from the **OAuth2** section of your application in the Developer Portal.                                           |
   | DISCORD_BOT_TOKEN      | Copy it from the **Bot** section of your application in the Developer Portal.                                              |
   | DISCORD_PUBLIC_KEY     | Copy it from the **General Information** section of your application in the Developer Portal.                              |
   | GUILD_ID               | This is where the developer mode you enabled in step 4 comes in handy. Right click your server icon and press **Copy ID**. |
   | APPEALS_CHANNEL        | Same deal as the guild ID, but with the channel you created in step 3.                                                   |
   | JWT_SECRET             | Use a password manager to generate a password with ~50 characters, or mash your keyboard.                                  |

7. Login to the [Vercel dashboard](https://vercel.com/dasboard) and go to the Settings tab for your site.

8. Click **Domains** and edit the Production domain to something unique, or [setup a custom domain](https://vercel.com/docs/concepts/projects/custom-domains).

9. Go back to the [Discord Developer Portal](https://discord.com/developers/applications), open the dashboard for the application you created in step 1.

10. Click on **Interactions Endpoint URL** and enter `https://[site-name].vercel.app/api/interactions`, replacing `[site-name]` by the name you picked in step 8 (or the entire Vercel domain by your own domain, if you opted for that).

11. Hit the green **Save Changes** button.

12. Go to the **OAuth2** section, click on **Add Redirect** and enter the same URL as in step 10, except with `/api/oauth-callback` instead of `/api/interactions/`.

13. Again, click the **Save Changes** button.

14. You should be good to go! You might want to test if it works as intended with an alt account, and if you encounter any problems feel free to [create an issue on GitHub](https://github.com/Microsoft-community/discord-ban-appeals/issues/new).

## Blocking users

Users that spam requests can be blocked by creating an environment variable called `BLOCKED_USERS`, which should contain a comma-separated list of user IDs. To do this:

1. On your [Vercel dashboard](https://vercel.com/dashboard), go to the project with your site, go to the **Settings** tab and click **Environment Variables**. 

2. Right click on any mention of the user you want to block, and click **Copy ID**. You need Developer mode enabled for this option to show up, see instructions above.

3. Under the **Add New** section, set the Name to `BLOCKED_USERS` and the Value to the user ID you just copied.
   ![](https://cdn.discordapp.com/attachments/935792341044850708/939521182540120064/unknown.png)

4. Click **Add**.

5. Go to the **Deployments** tab, click the ⋮ next to the topmost item in the list, then click **Redeploy**.
Check 'Redeploy with existing Build Cache', then click Redeploy.

6. To add more IDs, repeat step 1 and 2, scroll down until the list of variables in Vercel's dashboard, click the ⋮ next to `BLOCKED_USERS` and click **Edit**. Add a comma after the existing value, paste in the copied ID and click **Save**. Redeploy the site as in step 5.
   ![](https://cdn.discordapp.com/attachments/935792341044850708/939526460002156554/SZ704XbmSp.gif)
