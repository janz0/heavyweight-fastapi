#!/bin/bash

psql "$POSTGRES_DATABASE_URL" -c "SELECT create_upcoming_mon_sensor_data_partitions();"
