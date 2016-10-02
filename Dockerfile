FROM httpd:2.4
MAINTAINER Sylvain Gandon <krack_6@hotmail.com>


COPY ./reverse.conf /usr/local/apache2/conf.d/reverse.conf

RUN echo 'Include /usr/local/apache2/conf.d/*.conf' >> /usr/local/apache2/conf/httpd.conf
