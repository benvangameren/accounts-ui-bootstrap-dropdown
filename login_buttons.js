(function () {
    if (!Accounts._loginButtons)
        Accounts._loginButtons = {};

    // for convenience
    var loginButtonsSession = Accounts._loginButtonsSession;

    Handlebars.registerHelper(
        "googleLoginButton",
        function (options) {
            if (options.hash.align === "right")
                return new Handlebars.SafeString(Template._googleLoginButton({align: "right"}));
            else
                return new Handlebars.SafeString(Template._googleLoginButton({align: "left"}));
        }
    );

    //
    // loginButtonLoggedOut template
    //
    Template._googleLoginButtonsLoggedOut.singleService = function () {
        var services = Accounts._loginButtons.getLoginServices();
        if (services.length !== 1)
            throw new Error(
                "Shouldn't be rendering this template with more than one configured service");
        return services[0];
    };

    Template._googleLoginButtonsLoggedOut.configurationLoaded = function () {
        return Accounts.loginServicesConfigured();
    };

    Template._googleLoginButtonsLoggedOut.dropdown = function () {
        console.log(Accounts._loginButtons.dropdown());
        return Accounts._loginButtons.dropdown();
    };

    Accounts._loginButtons.getLoginServices = function () {
        var ret = [];
        // make sure to put password last, since this is how it is styled
        // in the ui as well.
        _.each(
            ['google'],
            function (service) {
                if (Accounts[service])
                    ret.push({name: service});
            });

        return ret;
    };

    Accounts._loginButtons.getPasswordService = function () {
        var ret = [];
        // make sure to put password last, since this is how it is styled
        // in the ui as well.
        _.each(
            ['password'],
            function (service) {
                if (Accounts[service])
                    ret.push({name: service});
            });

        return ret;
    };

    Template._googleLoginButton.events({
        'click #login-buttons-logout': function() {
            console.log('Logout');
            Meteor.logout(function () {
                loginButtonsSession.closeDropdown();
            });
        }
    });

    Template._googleLoginButton.displayName = function () {
        return Accounts._loginButtons.displayName();
    };




    Handlebars.registerHelper(
        "loginButton",
        function (options) {
            if (options.hash.align === "right")
                return new Handlebars.SafeString(Template._loginButton({align: "right"}));
            else
                return new Handlebars.SafeString(Template._loginButton({align: "left"}));
        }
    );

    Template._loginButtonsLoggedOut.singleService = function () {
        var services = Accounts._loginButtons.getPasswordService();
        if (services.length !== 1)
            throw new Error(
                "Shouldn't be rendering this template with more than one configured service");
        return services[0];
    };

    Template._loginButtonsLoggedOut.configurationLoaded = function () {
        return Accounts.loginServicesConfigured();
    };

    Template._loginButtonsLoggedOut.dropdown = function () {
        return Accounts._loginButtons.dropdown();
    };

    Template._loginButton.events({
        'click input, click label, click button, click .dropdown-menu, click .alert': function(event) {
            event.stopPropagation();
        },
        'click #login-buttons-logout': function() {
            Meteor.logout(function () {
                loginButtonsSession.closeDropdown();
            });
        },
        'click #login-buttons-password': function () {
            console.log('Login!');
            loginButtonsSession.resetMessages();

            var username = trimmedElementValueById('login-username');
            var email = trimmedElementValueById('login-email');
            var usernameOrEmail = trimmedElementValueById('login-username-or-email');
            // notably not trimmed. a password could (?) start or end with a space
            var password = elementValueById('login-password');

            var loginSelector;
            if (username !== null) {
                if (!Accounts._loginButtons.validateUsername(username))
                    return;
                else
                    loginSelector = {username: username};
            } else if (email !== null) {
                if (!Accounts._loginButtons.validateEmail(email))
                    return;
                else
                    loginSelector = {email: email};
            } else if (usernameOrEmail !== null) {
                // XXX not sure how we should validate this. but this seems good enough (for now),
                // since an email must have at least 3 characters anyways
                if (!Accounts._loginButtons.validateUsername(usernameOrEmail))
                    return;
                else
                    loginSelector = usernameOrEmail;
            } else {
                throw new Error("Unexpected -- no element to use as a login user selector");
            }

            Meteor.loginWithPassword(loginSelector, password, function (error, result) {
                if (error) {
                    loginButtonsSession.errorMessage(error.reason || "Unknown error");
                } else {
                    loginButtonsSession.closeDropdown();
                }
            });
        }
    });

    Template._loginButton.displayName = function () {
        return Accounts._loginButtons.displayName();
    };











    //
    // loginButtonsMessage template
    //

    Template._loginButtonsMessages.errorMessage = function () {
        return loginButtonsSession.get('errorMessage');
    };

    Template._loginButtonsMessages.infoMessage = function () {
        return loginButtonsSession.get('infoMessage');
    };


    Template._loginButtonsLoggedOutPasswordService.fields = function () {
        var loginFields = [
            {fieldName: 'username-or-email', fieldLabel: 'Username or Email',
                visible: function () {
                    return _.contains(
                        ["USERNAME_AND_EMAIL", "USERNAME_AND_OPTIONAL_EMAIL"],
                        Accounts.ui._passwordSignupFields());
                }},
            {fieldName: 'username', fieldLabel: 'Username',
                visible: function () {
                    return Accounts.ui._passwordSignupFields() === "USERNAME_ONLY";
                }},
            {fieldName: 'email', fieldLabel: 'Email', inputType: 'email',
                visible: function () {
                    return Accounts.ui._passwordSignupFields() === "EMAIL_ONLY";
                }},
            {fieldName: 'password', fieldLabel: 'Password', inputType: 'password',
                visible: function () {
                    return true;
                }}
        ];

        return loginFields;
    };

    Template._loginButtonsFormField.inputType = function () {
        return this.inputType || "text";
    };


  //
  // helpers
  //

  Accounts._loginButtons.displayName = function () {
    var user = Meteor.user();
    if (!user)
      return '';

    if (user.profile && user.profile.name)
      return user.profile.name;
    if (user.username)
      return user.username;
    if (user.emails && user.emails[0] && user.emails[0].address)
      return user.emails[0].address;

    return '';
  };

  Accounts._loginButtons.hasPasswordService = function () {
    return Accounts.password;
  };

  Accounts._loginButtons.dropdown = function () {
    return Accounts._loginButtons.hasPasswordService() || Accounts._loginButtons.getLoginServices().length > 1;
  };

  // XXX improve these. should this be in accounts-password instead?
  //
  // XXX these will become configurable, and will be validated on
  // the server as well.
  Accounts._loginButtons.validateUsername = function (username) {
    if (username.length >= 3) {
      return true;
    } else {
      loginButtonsSession.errorMessage("Username must be at least 3 characters long");
      return false;
    }
  };
  Accounts._loginButtons.validateEmail = function (email) {
    if (Accounts.ui._passwordSignupFields() === "USERNAME_AND_OPTIONAL_EMAIL" && email === '')
      return true;

    if (email.indexOf('@') !== -1) {
      return true;
    } else {
      loginButtonsSession.errorMessage("Invalid email");
      return false;
    }
  };
  Accounts._loginButtons.validatePassword = function (password) {
    if (password.length >= 6) {
      return true;
    } else {
      loginButtonsSession.errorMessage("Password must be at least 6 characters long");
      return false;
    }
  };

    var elementValueById = function(id) {
        var element = document.getElementById(id);
        if (!element)
            return null;
        else
            return element.value;
    };

    var trimmedElementValueById = function(id) {
        var element = document.getElementById(id);
        if (!element)
            return null;
        else
            return element.value.replace(/^\s*|\s*$/g, ""); // trim;
    };

})();
