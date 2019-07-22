def route(flask_app):

    @flask_app.route("/analytics/heartbeat", methods=["POST"])
    def analytics_heartbeat():
        # TODO: Determine play sessions on the basis of this.
        pass

    @flask_app.route("/analytics/user_questionnaire", methods=["GET", "POST"])
    def analytics_questionnaire():
        pass


# TODO: Maintain a function-API and a REST wrapper.
# TODO: Extend this information in the 'User' schema.
#  - User questionnaire:
#    - Sex
#    - Age / estimate
#    - Do you trade stocks?
#  - Need a separate table with sessions.
#    - session_ip_addr
#    - session_start_time (as soon as log in)
#    - session_duration   (as soon as tab is closed)
