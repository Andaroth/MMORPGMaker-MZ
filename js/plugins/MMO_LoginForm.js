//=============================================================================
// MMO_LoginForm.js
//=============================================================================

/*:
 * @plugindesc MMORPG Maker MV - Login Form
 * @author Samuel LESPES CARDILLO
 *
 * @help
 * /!\ WARNING /!\
 * If you turn the "require account creation" to off, make sure to change the server
 * configuration "passwordRequired" to false.
 * 
 * @param allowAccountCreation
 * @text Require account creation
 * @type combo
 * @option Yes
 * @option No
 * @default Yes
 */

function LoginForm() {
  this.initialize.apply(this, arguments);
}

(function() {  
  LoginForm.Parameters = PluginManager.parameters('MMO_LoginForm');
  LoginForm.Parameters["allowAccountCreation"] = (LoginForm.Parameters["allowAccountCreation"] === "Yes") ? true : false;
  LoginForm.connectionLost = false;

  document.addEventListener("mmorpg_core_lost_connection", function() {
    let wasLogged = (MMO_Core_Player.Player.id !== undefined) ? true : false;
    LoginForm.connectionLost = true;

    if(wasLogged) SceneManager.goto(LoginForm);
    
    LoginForm.prototype.disableForm();
  })

  LoginForm.prototype = Object.create(Scene_Base.prototype);
  LoginForm.prototype.constructor = LoginForm;

  LoginForm.prototype.initialize = function() {
      Scene_Base.prototype.initialize.call(this);
  };

  LoginForm.prototype.reBindInput = function() {
    Input.initialize();
  }

  LoginForm.prototype.create = function() {
      Scene_Base.prototype.create.call(this);
      this.createBackground();
      this.createForeground();
  };

  LoginForm.prototype.start = function() {
      Scene_Base.prototype.start.call(this);
      SceneManager.clearStack();
      this.centerSprite(this._backSprite1);
      this.centerSprite(this._backSprite2);
      this.playTitleMusic();
      this.startFadeIn(this.fadeSpeed(), false);
      this.createLoginForm();
  };

  LoginForm.prototype.update = function() {
      Scene_Base.prototype.update.call(this);
  };

  LoginForm.prototype.isBusy = function() {
      return Scene_Base.prototype.isBusy.call(this);
  };

  LoginForm.prototype.terminate = function() {
      Scene_Base.prototype.terminate.call(this);
      SceneManager.snapForBackground();
  };

  LoginForm.prototype.createLoginForm = function() {
    // Generate the form depending on parameters (it is ugly but eh)
    let html = `<div id="LoginForm" style="z-index: 999999999999999; /* yep it's a lot */ position: fixed; top: 50vh; left: 50vw; background-color: rgba(0, 0, 0, 0.4); border-radius: 8px; margin: 0 auto; width: 400px; padding: 8px; transform: translate(-50%, 0);">
    <div style="color: white; text-align: center; width: 100%; margin-bottom: 16px;">Se connecter / S'inscrire</div>
    <div>
        <div id="loginErrBox" style="display: block; margin: 0 auto; text-align: center; width: 100%; font-family: Comic Sans, arial; font-size: 18px;"></div>
        <div>
            <input type="text" id="inputUsername" style="display: block; margin: 0 auto; font-size: 24px;" placeholder="Pseudo" class="login-input" /><br />
            <input type="password" id="inputPassword" style="display: block; margin: 0 auto; font-size: 24px;" placeholder="Mot de passe" class="login-input" />
        </div>

        <br />
        <button id="btnConnect" style="display: block; margin: 0 auto; border: 0; border-radius: 4px; padding: 8px; font-size: 24px;" class="">Jouer</button>
    </div>
    <div style="text-align: center; margin-top: 8px;"><a style="color: white;" href="http: //andaroth.art/mmorpg/register.html" target="_blank">S'inscrire</a></div>
</div>`;


    document.getElementById('text_zone').innerHTML = html;

    if(LoginForm.connectionLost) this.disableForm();
    else document.getElementById("inputUsername").focus();

    const verifyPass = () => {
      const pwdField = document.getElementById('inputPassword');
      const pwdValidPass = !!pwdField.value.length;
      const btnConnect = document.getElementById('btnConnect');
      if (pwdValidPass) {
        btnConnect.classList.remove('disabled');
        return true;
      } else {
        btnConnect.classList.add('disabled');
        return false;
      }
    };

    //Bind commands
    var that = this;
    document.getElementById("inputUsername").addEventListener('keypress', (e) => {
      verifyPass();
      if (e.which == 13) { //enter
        that.connectAttempt();
      }; 
    })
    document.getElementById("inputUsername").addEventListener('keydown', (e) => {
      if (e.which == 9) { // tabulation
        e.preventDefault();
        document.getElementById("inputPassword").focus();
      }
    });
    document.getElementById('inputPassword').addEventListener('keyup', () => {
      verifyPass();
    });
    document.getElementById('inputPassword').addEventListener('keydown', (e) => {
      verifyPass();
      if (e.which == 13) { //enter
        that.connectAttempt();
      }; 
    });
    document.getElementById('btnConnect').addEventListener('click', () => {
      if (verifyPass()) that.connectAttempt()
    });
    document.getElementById('inputPassword').addEventListener('keyup', () => {
      verifyPass();
    });
    // $("#ErrorPrinter").fadeIn({duration: 1000});
    MMO_Core.allowTouch = false;
  }

  LoginForm.prototype.displayError = function(message) {
    document.getElementById("loginErrBox").innerHTML = `<div style="color: red;">${message}</div>`;
  }

  LoginForm.prototype.disableForm = function() {
    this.displayError("Connection avec le serveur perdue.")
  }

  LoginForm.prototype.connectAttempt = function(){
    const verifyPass = () => {
      const pwdField = document.getElementById('inputPassword');
      const pwdValidPass = !!pwdField.value.length;
      const btnConnect = document.getElementById('btnConnect');
      if (pwdValidPass) {
        btnConnect.classList.remove('disabled');
        return true;
      } else {
        btnConnect.classList.add('disabled');
        return false;
      }
    };

    if (!verifyPass()) return;
    
    var that = this;
    let payload = { username: document.getElementById("inputUsername").value }
    if(LoginForm.Parameters["allowAccountCreation"]) payload.password = document.getElementById("inputPassword").value;

    if (payload.username.length < 4 || payload.username.length >= 25) return this.displayError("Vous devez rentrer un pseudo!");
    if(payload.username.includes(" ")) return this.displayError("Pas d'espace.");
    if(!payload.username.match(/^(?=[a-zA-Z0-9\s]{2,25}$)(?=[a-zA-Z0-9\s])(?:([\w\s*?])\1?(?!\1))+$/)) return this.displayError("Pas de caractères spéciaux.");

    MMO_Core.socket.on("login_success", function(data){
      if (data.err) return that.displayError("Erreur : " + data.err);
      // $("#ErrorPrinter").fadeOut({duration: 1000}).html("");

      MMO_Core_Player.Player = data["msg"];

      that.fadeOutAll();
      DataManager.setupNewGame();

      document.getElementById('LoginForm').style.display = 'none';

      SceneManager.goto(Scene_Map);
      MMO_Core.allowTouch = true;
      _requestFullScreen({browserOnly:true});
      setTimeout(async () => {
        setTimeout(async () => MMO_Core.socket.emit("new_message", '/count'), 1);
        MMO_Core.socket.emit("new_message", '/all vient de se connecter');
      }, 1000);
      return true;
    });

    MMO_Core.socket.on("login_error", function(data) {
      that.displayError(data.msg);      
    })

    // If you're no longer connected to socket - retry connection and then continue
    if (!MMO_Core.socket.connected) {
      MMO_Core.socket.connect();
    }

    MMO_Core.socket.emit("login", payload);
  }

  LoginForm.prototype.createBackground = function() {
      this._backSprite1 = new Sprite(ImageManager.loadTitle1($dataSystem.title1Name));
      this._backSprite2 = new Sprite(ImageManager.loadTitle2($dataSystem.title2Name));
      this.addChild(this._backSprite1);
      this.addChild(this._backSprite2);
  };

  LoginForm.prototype.createForeground = function() {
      this._gameTitleSprite = new Sprite(new Bitmap(Graphics.width, Graphics.height));
      this.addChild(this._gameTitleSprite);
      if ($dataSystem.optDrawTitle) {
          this.drawGameTitle();
      }
  };

  LoginForm.prototype.drawGameTitle = function() {
      var x = 20;
      var y = Graphics.height / 4;
      var maxWidth = Graphics.width - x * 2;
      var text = $dataSystem.gameTitle;
      this._gameTitleSprite.bitmap.outlineColor = 'black';
      this._gameTitleSprite.bitmap.outlineWidth = 8;
      this._gameTitleSprite.bitmap.fontSize = 72;
      this._gameTitleSprite.bitmap.drawText(text, x, y, maxWidth, 48, 'center');
  };

  LoginForm.prototype.centerSprite = function(sprite) {
      sprite.x = Graphics.width / 2;
      sprite.y = Graphics.height / 2;
      sprite.anchor.x = 0.5;
      sprite.anchor.y = 0.5;
  };

  LoginForm.prototype.playTitleMusic = function() {
      AudioManager.playBgm($dataSystem.titleBgm);
      AudioManager.stopBgs();
      AudioManager.stopMe();
  };

  // Overwriting the Title screen to display the login form
  Scene_Title.prototype.start = function() {
      Scene_Base.prototype.start.call(this);
      SceneManager.clearStack();
      SceneManager.goto(LoginForm);
  };

  // Overriding Input._shouldPreventDefault to allow the use of the 'backspace key'
  // in input forms.
  Input._shouldPreventDefault = function(e) {
    if(e === undefined) return;

    // switch (e) {
    //   case 8:     // backspace
    //     if ($(e.target).is("input, textarea"))
    //       break;
    //   case 33:    // pageup
    //   case 34:    // pagedown
    //   case 37:    // left arrow
    //   case 38:    // up arrow
    //   case 39:    // right arrow
    //   case 40:    // down arrow
    //       return true;
    // }
    return false;
  }
})();