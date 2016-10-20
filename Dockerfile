FROM nginx:latest
MAINTAINER Sylvain Gandon <krack_6@hotmail.com>


COPY ./nginx.conf /etc/nginx/conf.d/nginx.conf
