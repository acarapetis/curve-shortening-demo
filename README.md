# curve-shortening-demo

A browser-based interactive demonstration of curve shortening flow.
Now in (reasonably) well-structured TypeScript.

View it in action at <http://a.carapetis.com/csf>.

## Installation

Install node.js, clone this repository and run `npm install`.

## Development

Run `npm start` to start a development server, which will automatically open
your web browser to the running page. (Since the development build does not
include any compatibility shims, you'll probably want to be using Chrome or a
very recent version of Firefox.) Any changes you make to the code should
cause an automatic reload of the page.

## Building

Run `npm build` to compile the production javascript bundles, which are
compatible with older browsers. You can then install index.html and style.css
along with the resulting build/ directory on any web server.