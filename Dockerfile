FROM camunda/camunda-bpm-platform:tomcat-latest
RUN rm -r webapps/camunda-invoice webapps/examples webapps/h2
