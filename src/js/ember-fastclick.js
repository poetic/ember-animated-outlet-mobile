/*
 https://github.com/JamesHight/emberjs-touch

 Copyright (c) 2012 by:

 * James Hight
 *
 * Update to support ember-animated-outlet by Jake Craige 2013

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/


(function(){
  var touch = {
    start: false, // has the touchstart event been triggered and is it still a valid click event?
    // starting coordinates of touch event
    x: null,
    y: null,
    enabled: true
  };

  var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;
  var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);

  var fastClick = {
    findControl: function(labelElement) {
        if (labelElement.control !== undefined) {
          return labelElement.control;
        }

        // All browsers under test that support touch events also support the HTML5 htmlFor attribute
        if (labelElement.htmlFor) {
          return document.getElementById(labelElement.htmlFor);
        }

        // If no for attribute exists, attempt to retrieve the first labellable descendant element
        // the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
        return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
    },
    needsFocus: function(target) {
      switch (target.nodeName.toLowerCase()) {
        case 'textarea':
          return true;
        case 'select':
          return !deviceIsAndroid;
        case 'input':
          switch (target.type) {
          case 'button':
          case 'checkbox':
          case 'file':
          case 'image':
          case 'radio':
          case 'submit':
            return false;
          }

          // No point in attempting to focus disabled inputs
          return !target.disabled && !target.readOnly;
        default:
          return (/\bneedsfocus\b/).test(target.className);
        }
    }
  }


  // Temporarily disable touch to prevent duplicate clicks
  function disableTouch() {
    if (touch.enabled) {
      touch.enabled = false;
      setTimeout(function() {
        touch.enabled = true;
      }, 400);
    }
  }

  Ember.EventDispatcher.reopen({
    setupHandler: function(rootElement, event, eventName) {
      var self = this,
        moved;

      if (!touch.enabled) return;


      var touchHandler = function(evt, triggeringManager) {
        // Track touch events to see how far the user's finger has moved
        // If it is > 20 it will not trigger a click event

        switch(evt.type) {
          // Remember our starting point
          case 'touchstart':
            touch.start = true;
            touch.x = evt.originalEvent.touches[0].clientX;
            touch.y = evt.originalEvent.touches[0].clientY;
            evt.stopPropagation();
            break;

          // Monitor touchmove in case the user moves their finger away and then back to the original starting point
          case 'touchmove':
            if (touch.start) {
              moved = Math.max(Math.abs(evt.originalEvent.touches[0].clientX - touch.x),
                      Math.abs(evt.originalEvent.touches[0].clientY - touch.y));
              if (moved > 20)
                touch.start = false;
            }
            break;

          // Check end point
          case 'touchend':
            if (touch.start) {
              moved = Math.max(Math.abs(evt.originalEvent.changedTouches[0].clientX - touch.x),
                    Math.abs(evt.originalEvent.changedTouches[0].clientY - touch.y));
              if (moved < 20) {
                evt.preventDefault();
                evt.stopImmediatePropagation();
                // All tests have passed, trigger click event
                if (touch.enabled) {

                  var control
                  var $target = $(evt.target);
                  var type    = $target.attr('type');
                  var tagName = evt.target.tagName.toLowerCase()

                  if(tagName === 'label') {
                    control = $(fastClick.findControl(evt.target));
                    if(control.attr('type') == 'checkbox') {
                      control.prop('checked', !control.prop('checked')).change()
                    } else {
                      $(control).focus()
                    }

                  } else if(type == 'checkbox') {
                    $target.prop('checked', !$target.prop('checked')).change()

                  } else if (!$target.hasClass('needsclick') && fastClick.needsFocus(evt.target)){
                      if (deviceIsIOS && evt.target.setSelectionRange && evt.target.type.indexOf('date') !== 0 && evt.target.type !== 'time') {
                        length = evt.target.value.length;
                        evt.target.setSelectionRange(length, length);
                      } else {
                        evt.target.focus();
                      }

                  } else {
                    if (document.activeElement && document.activeElement !== evt.target) {
                      document.activeElement.blur();
                    }

                    $target.click();
                  }

                }
              }
              touch.start = false;
            }
            break;
        }

        // END touch code

        var view = Ember.View.views[this.id],
        result = true, manager = null;

        manager = self._findNearestEventManager(view,eventName);

        if (manager && manager !== triggeringManager) {
          if (eventName == 'click') {
            if (touch.enabled)
              disableTouch();
            else
              return false;
          }
          result = self._dispatchEvent(manager, evt, eventName, view);
        } else if (view) {
          result = self._bubbleEvent(view,evt,eventName);
        } else {
          evt.stopPropagation();
        }

        return result;
      }

      rootElement.delegate('.ember-view', event + '.ember', function(evt, triggeringManager) {
        return touchHandler.call(this, evt, triggeringManager)
      });

      rootElement.delegate('[data-ember-action]', event + '.ember', function(evt) {
        var actionId = Ember.$(evt.currentTarget).attr('data-ember-action'),
          action     = Ember.Handlebars.ActionHelper.registeredActions[actionId],
          handler    = action.handler;

        if (action.eventName === eventName) {
          if (touch.enabled)
            disableTouch();
          else
            return false;

          if(handler) {
            return handler(evt);
          }
        }
      });

      rootElement.delegate('.animated-link-view', event + '.ember', function(evt, triggeringManager) {
        return touchHandler.call(this, evt, triggeringManager)
      });
    }
  });
})();

