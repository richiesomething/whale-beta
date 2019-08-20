# Mailgun configuration to send confirmation email
# Need to upgrade mailgun acct and change API and Domain before you can send to other emails.
import requests
def mailgun_func(email,link):
    return requests.post(
                        "https://api.mailgun.net/v3/sandbox733006853a7f4c67b96a6f462870f5b9.mailgun.org/messages",
                        auth=("api", "5c2009a1104fa88a3af6c082c8b0e80e-2ae2c6f3-40ba9c00"),
                        data={"from": "Whale, Inc <mailgun@sandbox733006853a7f4c67b96a6f462870f5b9.mailgun.org>",
                              "to": [(email)],
                              "subject": "Confirm your Whale Account",
                              "text": "Click this link to confirm your Whale Account {}".format(link)})
         