#!/bin/bash 
gcloud functions deploy announcer --project=entretien-prd --max-instances=1 --runtime=nodejs16 --trigger-topic=announcer_trigger
