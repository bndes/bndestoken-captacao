FROM node:8 as builder
ADD . /bndestoken-captacao-front
WORKDIR /bndestoken-captacao-front
RUN npm install
RUN cp -r bndes-ux4 node_modules

RUN npm run-script build


FROM nginx
# Corrigir timezone
RUN ln -snf /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime

ADD nginx.conf /etc/nginx/
ADD default.conf /etc/nginx/conf.d/


# Copy result of build to nginx folder
COPY --from=builder /bndestoken-captacao-front/dist /usr/share/nginx/html

# Expondo as portas necessárias
EXPOSE 8000

## package.json:
# scripts: {
#   postinstall: "cp -r ../bndes-ux4 node_modules/"
#   build: ng build --prod
# }
## 
