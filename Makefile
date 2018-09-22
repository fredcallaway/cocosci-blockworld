index.html:
	cp templates/exp.html index.html

all: 
	coffee -o static/js -cb src/*

watch:
	coffee -o static/js -cbw src/*

clean:
	rm static/json/*

demo:
	cp templates/exp.html index.html
	rsync -av --delete-after --copy-links . cocosci@cocosci-mcrl.dreamhosters.com:/home/cocosci/cocosci.dreamhosters.com/webexpt/webofcash-demo