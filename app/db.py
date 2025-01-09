import pymysql
# import bcrypt

# mariadb root: @[mdb_Root#9]
# phpmyadmin root: @[pma_Root#9]

# informasi database
db_host = 'localhost'
db_user = 'alisatia'
db_password = '@[db_aliSatia#9]'
# db_user = 'root'
# db_password = ''
db_database = 'flask_pi'
db_cursorclass = pymysql.cursors.DictCursor

# ambil data produk
def get_product_model(ag_code):
    material_codes_str = ','.join(map(str, ag_code))
    conn = pymysql.connect(host=db_host, user=db_user, password=db_password, database=db_database, cursorclass=db_cursorclass)

    try:
        with conn.cursor() as cursor:
            sql = f"SELECT * FROM pi_product WHERE p_code IN ({material_codes_str})"
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