# BlockWorld

A world with blocks!


## Viewing locally
To speed up development, you can view the experiment on a locally hosted server (without heroku). Just spin up a static web server and view it in the browser. Note that opening index.html separaetly will not work.

```
# If Python version returned above is 3.X
python -m http.server
# If Python version returned above is 2.X
python -m SimpleHTTPServer
```

**NOTE:** templates/exp.html is the "real" primary html page. If you want to edit index.html, you shoudl first edit templates/exp.html and then type `make index.html`.