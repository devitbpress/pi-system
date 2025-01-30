import pymysql
# import bcrypt

# mariadb root: @[mdb_Root#9]
# phpmyadmin root: @[pma_Root#9]

# informasi database
db_host = 'localhost'
db_user = 'alisatia'
db_password = '@[db_aliSatia#9]'
db_user = 'root'
db_password = ''
db_database = 'flask_pi'
db_cursorclass = pymysql.cursors.DictCursor

def get_user(ag_email, ag_password):
    conn = pymysql.connect(host=db_host, user=db_user, password=db_password, database=db_database, cursorclass=db_cursorclass)

    try:
        with conn.cursor() as cursor:
            query = "SELECT * FROM pi_user WHERE u_email = %s AND u_password = %s"
            cursor.execute(query, (ag_email, ag_password))
            user = cursor.fetchone()

        if user:
            return {"status": "success", 'sid': user['u_uniq']}
        else:
            return {"status": "failed"}

    except Exception as e:
        print("Error:", str(e))
        return {"status": "error", "message": str(e)}

    finally:
        conn.close()

def get_product_model(ag_code):
    material_codes_str = ','.join(map(str, ag_code))
    conn = pymysql.connect(host=db_host, user=db_user, password=db_password, database=db_database, cursorclass=db_cursorclass)

    try:
        with conn.cursor() as cursor:
            sql = f"SELECT p_code AS material_code, p_abc AS indicator, p_price AS price, p_lead_m AS lead_time FROM pi_product WHERE p_code IN ({material_codes_str}) GROUP BY p_code"
            cursor.execute(sql)
            products = cursor.fetchall()

        if products:
            return ["success", products]
        else:
            return ["failed", "empty"]

    except Exception as e:
        print("Error:", str(e))
        return ['failed', str(e)]

    finally:
        conn.close()

def get_product(item):
    conn = pymysql.connect(host=db_host, user=db_user, password=db_password, database=db_database, cursorclass=db_cursorclass)
    try:
        with conn.cursor() as cursor:
            sql = "SELECT * FROM pi_product LIMIT %s, %s"
            cursor.execute(sql, (item['limit'], item['size']))
            result = cursor.fetchall()

            if result:
                return {'status': 'success', 'data': result}
            else:
                return {'status': 'failed', 'data': 'empty'}

    except Exception as e:
        return {'status': 'error', 'message': str(e)}

    finally:
        conn.close()

def put_product(value, field, id):
    conn = pymysql.connect(host=db_host, user=db_user, password=db_password, database=db_database, cursorclass=db_cursorclass)
    try:
        with conn.cursor() as cursor:
            sql = f"UPDATE pi_product SET {field}=%s WHERE p_id=%s"
            cursor.execute(sql, (value, id))
            conn.commit()

        return {'status': 'success', 'data': 'All updates completed successfully'}

    except Exception as e:
        conn.rollback()
        return {'status': 'error', 'message': str(e)}

    finally:
        conn.close()
