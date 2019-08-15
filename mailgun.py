# Mailgun configuration to send confirmation email
import requests
def mailgun_func(email_id,link):
    return requests.post(
                        "https://api.mailgun.net/v3/sandbox307893a717024ac0b9d3b211e5b4084a.mailgun.org/messages",
                        auth=("api", "86d18e246837409deef18415475cef16-898ca80e-557c2ee0"),
                        data={"from": "Whale, Inc <mailgun@sandbox307893a717024ac0b9d3b211e5b4084a.mailgun.org>",
                              "to": [(email_id)],
                              "subject": "Confirm your Whale Account",
                              "text": "Click this link to confirm your Whale Account {}".format(link)})
                        
                    